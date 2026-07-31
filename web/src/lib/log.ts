// Logging tối giản, AN TOÀN: KHÔNG bao giờ ghi nội dung câu hỏi/câu trả lời hay
// định danh thật của người dùng. Id người dùng được băm (hash) trước khi log.
import { createHash } from "crypto";

export function hashId(id: string | number): string {
  return createHash("sha256").update(String(id)).digest("hex").slice(0, 12);
}

export interface LogFields {
  event: string; // vd: chat_request | chat_answered | chat_blocked | chat_error | zalo_message
  channel?: string; // web | zalo
  product?: string | null;
  role?: string;
  outcome?: string; // answer | fallback | blocked | error
  latencyMs?: number;
  userRef?: string | number; // sẽ được BĂM, không log id thật
  // CỐ Ý không có trường nội dung (question/answer) để tránh lộ dữ liệu.
}

export function formatLog(fields: LogFields): string {
  const { userRef, ...rest } = fields;
  const payload: Record<string, unknown> = {
    ts: new Date().toISOString(),
    ...rest,
  };
  if (userRef !== undefined && userRef !== null) payload.user = hashId(userRef);
  return JSON.stringify(payload);
}

export function logEvent(fields: LogFields): void {
  console.log(formatLog(fields));
}
