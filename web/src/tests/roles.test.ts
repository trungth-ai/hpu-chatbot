import { describe, it, expect } from "vitest";
import { isValidRole, VALID_ROLES } from "@/lib/admin/roles";

describe("isValidRole — chặn vai trò lạ (Sprint 6)", () => {
  it("chấp nhận các vai trò hợp lệ", () => {
    for (const r of VALID_ROLES) expect(isValidRole(r)).toBe(true);
  });
  it("từ chối vai trò không hợp lệ", () => {
    for (const r of ["root", "superadmin", "", null, undefined, 1, {}]) {
      expect(isValidRole(r)).toBe(false);
    }
  });
  it("có đủ 4 vai trò chuẩn", () => {
    expect(VALID_ROLES).toEqual(["sinh-vien", "cbgv", "phong-dao-tao", "admin"]);
  });
});
