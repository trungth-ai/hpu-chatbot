/** Suy ra tiêu đề hội thoại từ câu hỏi đầu tiên (cắt gọn, gộp khoảng trắng). */
export function deriveTitle(text: string, max = 48): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + "…";
}
