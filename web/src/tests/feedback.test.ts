import { describe, it, expect } from "vitest";
import { parseRating } from "@/lib/chat/feedback";

describe("parseRating — chuẩn hóa phản hồi (Sprint 5)", () => {
  it("chấp nhận 1 và -1 (số)", () => {
    expect(parseRating(1)).toBe(1);
    expect(parseRating(-1)).toBe(-1);
  });
  it("chấp nhận '1' và '-1' (chuỗi)", () => {
    expect(parseRating("1")).toBe(1);
    expect(parseRating("-1")).toBe(-1);
  });
  it("từ chối giá trị khác", () => {
    for (const v of [0, 2, -2, "👍", null, undefined, {}, "abc"]) {
      expect(parseRating(v)).toBeNull();
    }
  });
});
