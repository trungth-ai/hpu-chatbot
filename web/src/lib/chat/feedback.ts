/** Chuẩn hóa rating phản hồi: chỉ chấp nhận 1 (👍) hoặc -1 (👎). */
export function parseRating(v: unknown): 1 | -1 | null {
  if (v === 1 || v === "1") return 1;
  if (v === -1 || v === "-1") return -1;
  return null;
}
