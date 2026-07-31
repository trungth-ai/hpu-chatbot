import { verifyZaloSignature } from "@/lib/zalo/signature";
import { parseZaloEvent, truncateForZalo, type ZaloIncoming } from "@/lib/zalo/format";
import { sendZaloMessage } from "@/lib/zalo/client";
import { upsertZaloUser } from "@/lib/zalo/users";
import { checkZaloRateLimit } from "@/lib/rate-limit";
import { answerQuestion } from "@/lib/rag/answer";
import { logEvent } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Xác minh webhook (Zalo gọi GET khi thiết lập)
export async function GET(req: Request) {
  const challenge = new URL(req.url).searchParams.get("challenge");
  return new Response(challenge ?? "OK", { status: 200 });
}

export async function POST(req: Request) {
  const raw = await req.text();
  let body: unknown = {};
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("bad_request", { status: 400 });
  }

  // Xác thực chữ ký (nếu đã cấu hình OA Secret Key)
  const secret = process.env.ZALO_APP_SECRET;
  if (secret) {
    const ts = String((body as { timestamp?: unknown })?.timestamp ?? "");
    const ok = verifyZaloSignature({
      appId: process.env.ZALO_APP_ID ?? "",
      data: raw,
      timestamp: ts,
      secret,
      header: req.headers.get("X-ZEvent-Signature"),
    });
    if (!ok) return new Response("invalid_signature", { status: 401 });
  }

  const incoming = parseZaloEvent(body);
  if (!incoming) return new Response("ignored", { status: 200 }); // không phải tin text

  // Xử lý nền, trả 200 nhanh để Zalo không timeout
  void handleIncoming(incoming);
  return new Response("OK", { status: 200 });
}

async function handleIncoming({ userId, text }: ZaloIncoming): Promise<void> {
  try {
    const rl = checkZaloRateLimit(userId);
    if (!rl.allowed) {
      await sendZaloMessage(userId, `Anh/chị nhắn hơi nhanh rồi 😅 đợi khoảng ${rl.retryAfter}s nhé.`);
      return;
    }
    const role = await upsertZaloUser(userId); // mặc định sinh-vien
    const allowed = (process.env.ZALO_ALLOWED_PRODUCTS ?? "pmt-ems,tuyen-sinh")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const t0 = Date.now();
    const result = await answerQuestion({
      message: text,
      role,
      channel: "zalo",
      allowedProducts: allowed,
    });
    await sendZaloMessage(userId, truncateForZalo(result.text));
    logEvent({
      event: "zalo_message",
      channel: "zalo",
      product: result.product,
      role,
      outcome: result.blocked ? "blocked" : result.fallback ? "fallback" : "answer",
      latencyMs: Date.now() - t0,
      userRef: userId,
    });
  } catch (e) {
    console.error("Zalo handle lỗi:", e);
  }
}
