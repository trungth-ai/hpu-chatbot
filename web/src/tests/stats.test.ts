import { describe, it, expect } from "vitest";
import { containmentRate, satisfactionRate, toPercent } from "@/lib/admin/stats";

describe("containmentRate — tỉ lệ tự trả lời (Sprint 6)", () => {
  it("0 câu hỏi -> 0", () => expect(containmentRate(0, 0)).toBe(0));
  it("không có gap -> 1", () => expect(containmentRate(10, 0)).toBe(1));
  it("một nửa fallback -> 0.5", () => expect(containmentRate(10, 5)).toBe(0.5));
  it("gap > câu hỏi -> kẹp về 0", () => expect(containmentRate(5, 8)).toBe(0));
});

describe("satisfactionRate — tỉ lệ hài lòng", () => {
  it("chưa có phản hồi -> null", () => expect(satisfactionRate(0, 0)).toBeNull());
  it("toàn 👍 -> 1", () => expect(satisfactionRate(7, 0)).toBe(1));
  it("3 👍 / 1 👎 -> 0.75", () => expect(satisfactionRate(3, 1)).toBe(0.75));
});

describe("toPercent", () => {
  it("làm tròn %", () => {
    expect(toPercent(0.5)).toBe("50%");
    expect(toPercent(0.756)).toBe("76%");
    expect(toPercent(1)).toBe("100%");
  });
});
