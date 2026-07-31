/** Tỉ lệ tự trả lời (containment) = 1 - (số câu fallback / số câu hỏi). 0..1. */
export function containmentRate(userMessages: number, gaps: number): number {
  if (userMessages <= 0) return 0;
  const r = 1 - gaps / userMessages;
  return Math.max(0, Math.min(1, r));
}

/** Tỉ lệ hài lòng = up / (up + down). null nếu chưa có phản hồi. */
export function satisfactionRate(up: number, down: number): number | null {
  const total = up + down;
  if (total <= 0) return null;
  return up / total;
}

export function toPercent(x: number): string {
  return `${Math.round(x * 100)}%`;
}
