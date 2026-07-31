import { describe, it, expect } from "vitest";
import { truncateForZalo, parseZaloEvent } from "@/lib/zalo/format";

describe("truncateForZalo (Sprint 9)", () => {
  it("ngắn -> giữ nguyên", () => {
    expect(truncateForZalo("xin chào")).toBe("xin chào");
  });
  it("dài -> cắt còn <= 2000 + ghi chú", () => {
    const out = truncateForZalo("x".repeat(5000), 2000);
    expect(out.length).toBeLessThanOrEqual(2000);
    expect(out).toContain("chat.hpu.edu.vn");
  });
});

describe("parseZaloEvent (Sprint 9)", () => {
  it("sự kiện tin nhắn hợp lệ -> {userId, text}", () => {
    const r = parseZaloEvent({ sender: { id: 123 }, message: { text: "  cách nhập điểm  " } });
    expect(r).toEqual({ userId: "123", text: "cách nhập điểm" });
  });
  it("thiếu message/text -> null", () => {
    expect(parseZaloEvent({ sender: { id: 1 } })).toBeNull();
    expect(parseZaloEvent({ sender: { id: 1 }, message: { text: "   " } })).toBeNull();
  });
  it("thiếu người gửi -> null", () => {
    expect(parseZaloEvent({ message: { text: "hi" } })).toBeNull();
  });
  it("không phải object -> null", () => {
    expect(parseZaloEvent(null)).toBeNull();
    expect(parseZaloEvent("abc")).toBeNull();
  });
});
