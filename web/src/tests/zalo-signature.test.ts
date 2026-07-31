import { describe, it, expect } from "vitest";
import { computeZaloMac, parseMac, verifyZaloSignature } from "@/lib/zalo/signature";

describe("Chữ ký webhook Zalo (Sprint 9)", () => {
  const appId = "app123";
  const data = '{"event_name":"user_send_text"}';
  const ts = "1700000000000";
  const secret = "oa_secret";

  it("computeZaloMac tất định, đúng SHA256(appId+data+ts+secret)", () => {
    const m1 = computeZaloMac(appId, data, ts, secret);
    const m2 = computeZaloMac(appId, data, ts, secret);
    expect(m1).toBe(m2);
    expect(m1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("parseMac bóc tiền tố mac=", () => {
    expect(parseMac("mac=ABC123")).toBe("abc123");
    expect(parseMac("abc123")).toBe("abc123");
    expect(parseMac(null)).toBeNull();
  });

  it("verify đúng khi mac khớp", () => {
    const mac = computeZaloMac(appId, data, ts, secret);
    expect(verifyZaloSignature({ appId, data, timestamp: ts, secret, header: `mac=${mac}` })).toBe(true);
  });

  it("verify sai khi mac không khớp / thiếu header", () => {
    expect(
      verifyZaloSignature({ appId, data, timestamp: ts, secret, header: "mac=deadbeef" }),
    ).toBe(false);
    expect(verifyZaloSignature({ appId, data, timestamp: ts, secret, header: null })).toBe(false);
  });

  it("verify sai khi đổi data (chống giả mạo)", () => {
    const mac = computeZaloMac(appId, data, ts, secret);
    expect(
      verifyZaloSignature({ appId, data: data + "x", timestamp: ts, secret, header: `mac=${mac}` }),
    ).toBe(false);
  });
});
