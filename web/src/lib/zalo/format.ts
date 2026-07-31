// Cắt câu trả lời cho giới hạn tin nhắn Zalo (text ~2000 ký tự).
export function truncateForZalo(text: string, max = 2000): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 70).trimEnd();
  return cut + "…\n\n(Nội dung dài — anh/chị xem đầy đủ trên web chat.hpu.edu.vn nhé)";
}

export interface ZaloIncoming {
  userId: string;
  text: string;
}

// Trích người gửi + nội dung text từ sự kiện webhook Zalo (an toàn với dữ liệu thiếu).
export function parseZaloEvent(body: unknown): ZaloIncoming | null {
  const b = body as { sender?: { id?: unknown }; message?: { text?: unknown } } | null;
  const text = b?.message?.text;
  const userId = b?.sender?.id;
  if (typeof text !== "string" || !text.trim()) return null;
  if (userId === undefined || userId === null || String(userId).length === 0) return null;
  return { userId: String(userId), text: text.trim() };
}
