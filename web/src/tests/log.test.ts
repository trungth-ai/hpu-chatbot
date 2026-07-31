import { describe, it, expect } from "vitest";
import { hashId, formatLog } from "@/lib/log";

describe("log — an toàn, không lộ PII (Sprint 10)", () => {
  it("hashId tất định, ngắn, không phải id gốc", () => {
    expect(hashId(42)).toBe(hashId(42));
    expect(hashId(42)).toMatch(/^[a-f0-9]{12}$/);
    expect(hashId(42)).not.toContain("42");
  });

  it("formatLog băm userRef, KHÔNG ghi id thật", () => {
    const line = formatLog({ event: "chat_answered", userRef: 123456 });
    const obj = JSON.parse(line);
    expect(obj.user).toBe(hashId(123456));
    expect(line).not.toContain("123456");
    expect(obj).not.toHaveProperty("userRef");
  });

  it("ghi các trường vận hành (event/product/outcome/latency)", () => {
    const obj = JSON.parse(
      formatLog({ event: "chat_answered", channel: "web", product: "pmt-ems", outcome: "answer", latencyMs: 120 }),
    );
    expect(obj.event).toBe("chat_answered");
    expect(obj.product).toBe("pmt-ems");
    expect(obj.outcome).toBe("answer");
    expect(obj.latencyMs).toBe(120);
    expect(obj.ts).toBeTruthy();
  });

  it("KHÔNG có trường nội dung câu hỏi/câu trả lời", () => {
    const line = formatLog({ event: "chat_request", channel: "web" });
    expect(line).not.toContain("content");
    expect(line).not.toContain("question");
    expect(line).not.toContain("answer\"");
  });
});
