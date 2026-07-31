import { createHash, timingSafeEqual } from "crypto";

// Zalo OA webhook: header X-ZEvent-Signature = "mac=<sha256hex>",
// với sha256 = SHA256(appId + data + timestamp + OASecretKey).
// (data = raw body JSON; timestamp = trường timestamp trong body)
export function computeZaloMac(appId: string, data: string, timestamp: string, secret: string): string {
  return createHash("sha256").update(appId + data + timestamp + secret).digest("hex");
}

export function parseMac(header: string | null): string | null {
  if (!header) return null;
  const m = header.match(/mac=([A-Fa-f0-9]+)/);
  return (m ? m[1] : header.trim()).toLowerCase();
}

export function verifyZaloSignature(opts: {
  appId: string;
  data: string;
  timestamp: string;
  secret: string;
  header: string | null;
}): boolean {
  const expected = computeZaloMac(opts.appId, opts.data, opts.timestamp, opts.secret).toLowerCase();
  const got = parseMac(opts.header);
  if (!got) return false;
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(got, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
