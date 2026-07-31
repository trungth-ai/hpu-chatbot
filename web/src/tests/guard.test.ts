import { describe, it, expect } from "vitest";
import type { Session } from "next-auth";
import { isAdminSession } from "@/lib/auth/guard";

function sess(isAdmin?: boolean): Session {
  return { user: { isAdmin }, expires: "" } as unknown as Session;
}

describe("isAdminSession — chặn non-admin (Sprint 6)", () => {
  it("null -> false", () => expect(isAdminSession(null)).toBe(false));
  it("không có isAdmin -> false", () => expect(isAdminSession(sess(undefined))).toBe(false));
  it("isAdmin=false -> false", () => expect(isAdminSession(sess(false))).toBe(false));
  it("isAdmin=true -> true", () => expect(isAdminSession(sess(true))).toBe(true));
});
