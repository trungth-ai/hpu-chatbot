// Giới hạn tần suất theo cửa sổ thời gian. Lõi rateLimitCheck là THUẦN (truyền store + now)
// để test tất định. Bộ đếm in-memory phù hợp triển khai 1 instance (Docker 1 server).
// Nhiều instance -> thay store bằng Redis.

export interface RateState {
  count: number;
  resetAt: number;
}

export interface RateResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // giây
}

export function rateLimitCheck(
  store: Map<string, RateState>,
  key: string,
  limit: number,
  windowMs: number,
  now: number,
): RateResult {
  const cur = store.get(key);
  if (!cur || now >= cur.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (cur.count < limit) {
    cur.count += 1;
    return { allowed: true, remaining: limit - cur.count, retryAfter: 0 };
  }
  return {
    allowed: false,
    remaining: 0,
    retryAfter: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)),
  };
}

const CHAT_LIMIT = Number(process.env.CHAT_RATE_LIMIT ?? "20");
const CHAT_WINDOW_MS = Number(process.env.CHAT_RATE_WINDOW_MS ?? "60000");
const chatStore = new Map<string, RateState>();

export function checkChatRateLimit(userId: number): RateResult {
  return rateLimitCheck(chatStore, `chat:${userId}`, CHAT_LIMIT, CHAT_WINDOW_MS, Date.now());
}

const ZALO_LIMIT = Number(process.env.ZALO_RATE_LIMIT ?? "15");
const zaloStore = new Map<string, RateState>();

export function checkZaloRateLimit(zaloUserId: string): RateResult {
  return rateLimitCheck(zaloStore, `zalo:${zaloUserId}`, ZALO_LIMIT, CHAT_WINDOW_MS, Date.now());
}
