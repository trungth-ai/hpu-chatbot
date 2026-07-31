import { describe, it, expect } from "vitest";
import { isAllowedEmail, resolveRole } from "@/lib/auth/domain";

describe("isAllowedEmail — chặn miền (Sprint 1)", () => {
  const HD = "hpu.edu.vn";

  it("cho phép email đúng miền @hpu.edu.vn", () => {
    expect(isAllowedEmail("trungth@hpu.edu.vn", HD)).toBe(true);
  });

  it("chặn email miền khác (gmail)", () => {
    expect(isAllowedEmail("someone@gmail.com", HD)).toBe(false);
  });

  it("chặn email rỗng / null / undefined", () => {
    expect(isAllowedEmail(undefined, HD)).toBe(false);
    expect(isAllowedEmail(null, HD)).toBe(false);
    expect(isAllowedEmail("", HD)).toBe(false);
  });

  it("không phân biệt hoa/thường", () => {
    expect(isAllowedEmail("Trung.TH@HPU.Edu.Vn", HD)).toBe(true);
  });

  it("chặn email gian lận có 2 dấu @", () => {
    expect(isAllowedEmail("a@x@hpu.edu.vn", HD)).toBe(false);
  });

  it("chặn subdomain giả mạo (evilhpu.edu.vn)", () => {
    expect(isAllowedEmail("a@evilhpu.edu.vn", HD)).toBe(false);
  });

  it("chặn miền chứa hpu.edu.vn ở giữa", () => {
    expect(isAllowedEmail("a@hpu.edu.vn.evil.com", HD)).toBe(false);
  });
});

describe("resolveRole — gán vai trò (Sprint 1)", () => {
  const adminEmails = ["trungth@hpu.edu.vn"];
  const studentRegex = /^[a-z]{2}\d{5,}@/;

  it("email trong danh sách admin -> admin + isAdmin=true", () => {
    expect(resolveRole("trungth@hpu.edu.vn", { adminEmails, studentRegex })).toEqual({
      role: "admin",
      isAdmin: true,
    });
  });

  it("email admin không phân biệt hoa/thường", () => {
    expect(resolveRole("TrungTH@hpu.edu.vn", { adminEmails, studentRegex })).toEqual({
      role: "admin",
      isAdmin: true,
    });
  });

  it("email khớp mẫu sinh viên -> sinh-vien", () => {
    expect(resolveRole("sv12345@hpu.edu.vn", { adminEmails, studentRegex })).toEqual({
      role: "sinh-vien",
      isAdmin: false,
    });
  });

  it("email cán bộ/giảng viên -> cbgv", () => {
    expect(resolveRole("nga.td@hpu.edu.vn", { adminEmails, studentRegex })).toEqual({
      role: "cbgv",
      isAdmin: false,
    });
  });

  it("không có studentRegex thì mặc định cbgv", () => {
    expect(resolveRole("ai.do@hpu.edu.vn", { adminEmails })).toEqual({
      role: "cbgv",
      isAdmin: false,
    });
  });
});
