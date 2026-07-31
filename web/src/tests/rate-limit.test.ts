import { describe, it, expect } from "vitest";
import { rateLimitCheck, type RateState } from "@/lib/rate-limit";

describe("rateLimitCheck — giới hạn tần suất (Sprint 7)", () => {
  it("dưới hạn thì cho phép, đếm remaining giảm dần", () => {
    const store = new Map<string, RateState>();
    const r1 = rateLimitCheck(store, "u1", 3, 1000, 0);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    const r2 = rateLimitCheck(store, "u1", 3, 1000, 10);
    expect(r2.remaining).toBe(1);
    const r3 = rateLimitCheck(store, "u1", 3, 1000, 20);
    expect(r3.remaining).toBe(0);
  });

  it("vượt hạn thì chặn + có retryAfter", () => {
    const store = new Map<string, RateState>();
    for (let i = 0; i < 3; i++) rateLimitCheck(store, "u1", 3, 1000, 0);
    const blocked = rateLimitCheck(store, "u1", 3, 1000, 400);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("hết cửa sổ thì reset bộ đếm", () => {
    const store = new Map<string, RateState>();
    for (let i = 0; i < 3; i++) rateLimitCheck(store, "u1", 3, 1000, 0);
    expect(rateLimitCheck(store, "u1", 3, 1000, 500).allowed).toBe(false);
    const after = rateLimitCheck(store, "u1", 3, 1000, 1000); // now >= resetAt
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(2);
  });

  it("các key (user) độc lập nhau", () => {
    const store = new Map<string, RateState>();
    for (let i = 0; i < 3; i++) rateLimitCheck(store, "u1", 3, 1000, 0);
    expect(rateLimitCheck(store, "u1", 3, 1000, 0).allowed).toBe(false);
    expect(rateLimitCheck(store, "u2", 3, 1000, 0).allowed).toBe(true);
  });
});
