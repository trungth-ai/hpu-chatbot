import { describe, it, expect } from "vitest";
import { suggestionsForRole } from "@/lib/chat/suggestions";

describe("suggestionsForRole — chip gợi ý theo vai trò (Sprint 2)", () => {
  it("luôn trả về tối đa 4 gợi ý", () => {
    for (const role of ["cbgv", "sinh-vien", "phong-dao-tao", "admin", undefined]) {
      expect(suggestionsForRole(role).length).toBeLessThanOrEqual(4);
      expect(suggestionsForRole(role).length).toBeGreaterThan(0);
    }
  });

  it("giảng viên thấy gợi ý nhập điểm", () => {
    const labels = suggestionsForRole("cbgv").map((s) => s.label);
    expect(labels).toContain("Nhập điểm");
  });

  it("sinh viên thấy gợi ý đăng ký học phần", () => {
    const labels = suggestionsForRole("sinh-vien").map((s) => s.label);
    expect(labels).toContain("Đăng ký học phần");
  });

  it("giảng viên và sinh viên có bộ gợi ý khác nhau", () => {
    const cbgv = suggestionsForRole("cbgv").map((s) => s.label).join();
    const sv = suggestionsForRole("sinh-vien").map((s) => s.label).join();
    expect(cbgv).not.toEqual(sv);
  });

  it("vai trò lạ/không có -> mặc định (như sinh viên)", () => {
    const fallback = suggestionsForRole(undefined).map((s) => s.label);
    expect(fallback).toContain("Đăng ký học phần");
  });

  it("mỗi gợi ý có cả label và prompt không rỗng", () => {
    for (const s of suggestionsForRole("cbgv")) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.prompt.length).toBeGreaterThan(0);
    }
  });
});
