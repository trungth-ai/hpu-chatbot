import { auth } from "@/auth";
import { retrieve } from "@/lib/rag/retrieve";
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildHistoryTurns,
  buildTranscript,
  toCitations,
  shouldFallback,
  FALLBACK_MESSAGE,
} from "@/lib/rag/prompt";
import { streamAnswer, answerWithAdmissionTool, summarizeConversation } from "@/lib/rag/gemini";
import { classifyProduct } from "@/lib/rag/products";
import { logKnowledgeGap } from "@/lib/rag/gaps";
import { deriveTitle } from "@/lib/chat/title";
import { screenMessage } from "@/lib/chat/guard";
import { checkChatRateLimit } from "@/lib/rate-limit";
import {
  createConversation,
  conversationOwned,
  getMessages,
  getConversationMemory,
  setConversationMemory,
  saveMessage,
  setTitleIfEmpty,
  touchConversation,
} from "@/lib/db/conversations";
import { logEvent } from "@/lib/log";
import type { Citation } from "@/lib/chat/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const THRESHOLD = Number(process.env.SIMILARITY_THRESHOLD ?? "0.55");
const TOP_K = Number(process.env.RETRIEVAL_TOP_K ?? "6");
// Lớp 2 bộ nhớ: bắt đầu tóm tắt khi hội thoại đủ dài, và chỉ cập nhật lại sau mỗi vài tin (tiết kiệm gọi Gemini).
const MEMORY_L2 = process.env.MEMORY_L2 !== "0";
const SUMMARY_AFTER = Number(process.env.SUMMARY_AFTER ?? "8");
const SUMMARY_EVERY = Number(process.env.SUMMARY_EVERY ?? "6");

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.uid) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.uid;

  // --- Giới hạn tần suất ---
  const rl = checkChatRateLimit(userId);
  if (!rl.allowed) {
    return Response.json(
      {
        error: "rate_limited",
        message: `Anh/chị hỏi hơi nhanh rồi 😅 Đợi khoảng ${rl.retryAfter}s rồi thử lại giúp em nhé.`,
      },
      { status: 429 },
    );
  }

  let body: { message?: string; product?: string | null; conversationId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const message = (body.message ?? "").toString().trim();
  if (!message) {
    return Response.json({ error: "empty_message" }, { status: 400 });
  }

  const role = session.user.role ?? "sinh-vien";
  // Định tuyến phần mềm: ưu tiên lựa chọn của người dùng, nếu không thì tự đoán từ câu hỏi
  const product = body.product ?? classifyProduct(message);
  const t0 = Date.now();
  logEvent({ event: "chat_request", channel: "web", role, userRef: userId });

  // --- Chuẩn bị hội thoại + lưu tin người dùng ---
  let conversationId = body.conversationId;
  if (conversationId && !(await conversationOwned(conversationId, userId))) {
    conversationId = undefined;
  }
  if (!conversationId) {
    conversationId = await createConversation(userId, null);
  }
  // Lịch sử hội thoại (trước câu hỏi hiện tại) -> để model nhớ mạch trò chuyện
  const priorMessages = await getMessages(conversationId, userId);
  const history = buildHistoryTurns(
    priorMessages.map((m) => ({ role: m.role, content: m.content })),
    Number(process.env.HISTORY_MAX_CHARS ?? "8000"),
  );
  const convMemory = await getConversationMemory(conversationId);

  await saveMessage(conversationId, "user", message, null, product, "web");
  await setTitleIfEmpty(conversationId, deriveTitle(message));

  const convId = conversationId;
  const encoder = new TextEncoder();

  // Cờ đánh dấu client đã ngắt / controller đã đóng -> KHÔNG enqueue nữa
  let closed = false;
  // Client đóng tab / rời trang giữa chừng -> dừng stream, dừng tiêu tốn Gemini
  req.signal?.addEventListener("abort", () => {
    closed = true;
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Gửi an toàn: bỏ qua nếu đã đóng; nếu enqueue lỗi (controller đóng) -> đánh dấu closed
      const send = (obj: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        } catch {
          closed = true;
        }
      };
      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* đã đóng rồi thì thôi */
        }
      };
      const streamText = async (text: string, delay = 12) => {
        for (const part of text.split(/(\s+)/)) {
          if (closed) return;
          send({ type: "token", value: part });
          if (delay) await new Promise((r) => setTimeout(r, delay));
        }
      };

      send({ type: "meta", conversationId: convId });

      // --- Guardrail: chặn bẻ prompt / dò dữ liệu cá nhân (không gọi Gemini) ---
      const screen = screenMessage(message);
      if (screen.action === "block") {
        await streamText(screen.reply);
        const mid = await saveMessage(convId, "assistant", screen.reply, [], product, "web");
        await touchConversation(convId);
        send({ type: "done", citations: [], messageId: mid });
        logEvent({ event: "chat_blocked", channel: "web", role, outcome: "blocked", latencyMs: Date.now() - t0, userRef: userId });
        safeClose();
        return;
      }

      try {
        // Lớp 2: nếu hội thoại đã dài & bản tóm tắt cũ -> cập nhật ghi nhớ (bọc try, lỗi thì bỏ qua, L1 vẫn chạy)
        let memory = convMemory.summary;
        if (
          MEMORY_L2 &&
          priorMessages.length >= SUMMARY_AFTER &&
          priorMessages.length - convMemory.summaryUpto >= SUMMARY_EVERY
        ) {
          try {
            const transcript = buildTranscript(
              priorMessages.map((m) => ({ role: m.role, content: m.content })),
            );
            const updated = await summarizeConversation(transcript, memory);
            if (updated) {
              memory = updated;
              await setConversationMemory(convId, updated, priorMessages.length);
            }
          } catch (e) {
            console.error("Tóm tắt bộ nhớ lỗi (bỏ qua):", e);
          }
        }

        const chunks = await retrieve({ query: message, product, role, topK: TOP_K });
        let answer = "";
        let citations: Citation[] = [];

        if (product === "tuyen-sinh") {
          // Tuyển sinh: cho phép gọi tool tra cứu số liệu (Sprint 8 trả dữ liệu mẫu)
          const sys = buildSystemPrompt({ role, product, channel: "web", memory });
          const userPrompt = buildUserPrompt(message, chunks);
          answer = await answerWithAdmissionTool(sys, userPrompt);
          await streamText(answer, 0);
          citations = toCitations(chunks);
        } else if (shouldFallback(chunks, THRESHOLD)) {
          answer = FALLBACK_MESSAGE;
          await streamText(FALLBACK_MESSAGE);
          await logKnowledgeGap({ question: message, product, role, channel: "web" });
        } else {
          const sys = buildSystemPrompt({ role, product, channel: "web", memory });
          const userPrompt = buildUserPrompt(message, chunks);
          for await (const piece of streamAnswer(sys, userPrompt, history)) {
            if (closed) break; // client đã ngắt -> ngừng sinh tiếp
            answer += piece;
            send({ type: "token", value: piece });
          }
          citations = toCitations(chunks);
        }

        // Lưu câu trả lời (kể cả khi client đã ngắt, để không mất dữ liệu hội thoại)
        const mid = await saveMessage(convId, "assistant", answer, citations, product, "web");
        await touchConversation(convId);
        send({ type: "done", citations, messageId: mid });
        logEvent({
          event: "chat_answered",
          channel: "web",
          product,
          role,
          outcome: citations.length ? "answer" : "fallback",
          latencyMs: Date.now() - t0,
          userRef: userId,
        });
        safeClose();
      } catch (err) {
        console.error("/api/chat lỗi:", err);
        logEvent({ event: "chat_error", channel: "web", product, role, outcome: "error", latencyMs: Date.now() - t0, userRef: userId });
        // Lỗi Gemini/timeout/quota: xin lỗi nhẹ nhàng (send đã an toàn, không ném nếu đã đóng)
        send({
          type: "error",
          message:
            "Em đang gặp trục trặc kỹ thuật một chút 🙏 Anh/chị thử lại sau giây lát giúp em nhé. Nếu vẫn lỗi, có thể hệ thống Gemini đang quá tải.",
        });
        safeClose();
      }
    },
    cancel() {
      // Client hủy đọc stream -> đánh dấu đóng
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
