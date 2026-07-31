// Lõi RAG dùng chung (KHÔNG stream) — dùng cho Zalo OA và các kênh không stream khác.
// Web vẫn dùng đường stream riêng. Các khối nền (retrieve/prompt/gemini/guard) là dùng chung.
import { retrieve } from "./retrieve";
import {
  buildSystemPrompt,
  buildUserPrompt,
  toCitations,
  shouldFallback,
  FALLBACK_MESSAGE,
} from "./prompt";
import { answerOnce, answerWithAdmissionTool } from "./gemini";
import { classifyProduct } from "./products";
import { logKnowledgeGap } from "./gaps";
import { screenMessage } from "@/lib/chat/guard";
import type { Citation } from "@/lib/chat/stream";

const THRESHOLD = Number(process.env.SIMILARITY_THRESHOLD ?? "0.55");
const TOP_K = Number(process.env.RETRIEVAL_TOP_K ?? "6");

export interface AnswerResult {
  text: string;
  citations: Citation[];
  product: string | null;
  blocked: boolean;
  fallback: boolean;
}

export async function answerQuestion(opts: {
  message: string;
  role: string;
  channel: string;
  product?: string | null;
  allowedProducts?: string[]; // giới hạn phạm vi cho kênh công khai
}): Promise<AnswerResult> {
  // 1) Guardrail (bẻ prompt / dò PII người khác)
  const screen = screenMessage(opts.message);
  if (screen.action === "block") {
    return { text: screen.reply, citations: [], product: null, blocked: true, fallback: false };
  }

  // 2) Định tuyến phần mềm + áp phạm vi cho phép
  let product = opts.product ?? classifyProduct(opts.message);
  if (opts.allowedProducts && product && !opts.allowedProducts.includes(product)) {
    product = null; // chọn/đoán ra phần mềm ngoài phạm vi -> tìm trong danh sách cho phép
  }
  const products = opts.allowedProducts && !product ? opts.allowedProducts : null;

  // 3) Truy hồi
  const chunks = await retrieve({
    query: opts.message,
    product,
    products,
    role: opts.role,
    topK: TOP_K,
  });

  // 4) Tuyển sinh -> dùng tool; ngược lại fallback/sinh thường
  if (product === "tuyen-sinh") {
    const sys = buildSystemPrompt({ role: opts.role, product, channel: opts.channel });
    const text = await answerWithAdmissionTool(sys, buildUserPrompt(opts.message, chunks));
    return { text, citations: toCitations(chunks), product, blocked: false, fallback: false };
  }
  if (shouldFallback(chunks, THRESHOLD)) {
    await logKnowledgeGap({ question: opts.message, product, role: opts.role, channel: opts.channel });
    return { text: FALLBACK_MESSAGE, citations: [], product, blocked: false, fallback: true };
  }
  const sys = buildSystemPrompt({ role: opts.role, product, channel: opts.channel });
  const text = await answerOnce(sys, buildUserPrompt(opts.message, chunks));
  return { text, citations: toCitations(chunks), product, blocked: false, fallback: false };
}
