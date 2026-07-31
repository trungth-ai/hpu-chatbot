import { describe, it, expect } from "vitest";
import { deriveTitle } from "@/lib/chat/title";

describe("deriveTitle — tiêu đề hội thoại (Sprint 5)", () => {
  it("câu ngắn giữ nguyên", () => {
    expect(deriveTitle("Cách nhập điểm?")).toBe("Cách nhập điểm?");
  });
  it("gộp khoảng trắng thừa", () => {
    expect(deriveTitle("  Cách   nhập\n\nđiểm  ")).toBe("Cách nhập điểm");
  });
  it("câu dài bị cắt + thêm dấu …", () => {
    const long = "Hướng dẫn chi tiết cách nhập điểm cho lớp học phần trên hệ thống PMT-EMS của trường";
    const out = deriveTitle(long, 48);
    expect(out.length).toBeLessThanOrEqual(49); // 48 + dấu …
    expect(out.endsWith("…")).toBe(true);
  });
  it("đúng ngưỡng max thì không cắt", () => {
    const s = "x".repeat(48);
    expect(deriveTitle(s, 48)).toBe(s);
  });
});
