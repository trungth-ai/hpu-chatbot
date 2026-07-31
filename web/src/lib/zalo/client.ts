// Gửi tin nhắn qua Zalo OA + làm mới access token.
// LƯU Ý: token lưu in-memory (seed từ env). Production nên lưu token đã refresh
// vào DB/redis để không mất khi restart (Zalo refresh_token có xoay vòng).

const SEND_URL = "https://openapi.zalo.me/v3.0/oa/message/cs";
const REFRESH_URL = "https://oauth.zaloapp.com/v4/oa/access_token";

let accessToken = process.env.ZALO_ACCESS_TOKEN ?? "";

export async function refreshZaloToken(): Promise<boolean> {
  const refreshToken = process.env.ZALO_REFRESH_TOKEN;
  const appId = process.env.ZALO_APP_ID;
  const secret = process.env.ZALO_APP_SECRET;
  if (!refreshToken || !appId || !secret) return false;
  try {
    const res = await fetch(REFRESH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", secret_key: secret },
      body: new URLSearchParams({
        app_id: appId,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return false;
    const data = (await res.json().catch(() => null)) as { access_token?: string } | null;
    if (data?.access_token) {
      accessToken = data.access_token;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function sendZaloMessage(userId: string, text: string): Promise<boolean> {
  if (!accessToken) {
    console.error("Zalo: chưa cấu hình ZALO_ACCESS_TOKEN");
    return false;
  }
  const doSend = () =>
    fetch(SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: accessToken },
      body: JSON.stringify({ recipient: { user_id: userId }, message: { text } }),
    });
  let res = await doSend();
  if (res.status === 401) {
    if (await refreshZaloToken()) res = await doSend();
  }
  return res.ok;
}
