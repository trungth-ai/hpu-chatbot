import { describe, it, expect } from "vitest";
import { classifyProduct, getProduct, PRODUCTS } from "@/lib/rag/products";

describe("classifyProduct — tự định tuyến phần mềm (Sprint 8)", () => {
  it("câu về điểm/học phần -> pmt-ems", () => {
    expect(classifyProduct("Cách nhập điểm trên PMT-EMS?")).toBe("pmt-ems");
    expect(classifyProduct("đăng ký học phần thế nào")).toBe("pmt-ems");
  });
  it("câu về email/drive -> google-workspace", () => {
    expect(classifyProduct("Làm sao đổi mật khẩu email?")).toBe("google-workspace");
    expect(classifyProduct("chia sẻ google drive cho lớp")).toBe("google-workspace");
  });
  it("câu về tuyển sinh -> tuyen-sinh", () => {
    expect(classifyProduct("Điểm chuẩn ngành CNTT năm 2026?")).toBe("tuyen-sinh");
    expect(classifyProduct("chỉ tiêu tuyển sinh năm nay")).toBe("tuyen-sinh");
  });
  it("câu không rõ -> null (tìm mọi phần mềm)", () => {
    expect(classifyProduct("Xin chào")).toBeNull();
    expect(classifyProduct("Hôm nay trời đẹp nhỉ")).toBeNull();
  });
  it("'điểm chuẩn' không bị nhầm sang pmt-ems", () => {
    // pmt-ems không còn từ khóa 'điểm' trần -> 'điểm chuẩn' phải về tuyển sinh
    expect(classifyProduct("điểm chuẩn ngành ngôn ngữ Trung")).toBe("tuyen-sinh");
  });
});

describe("getProduct / PRODUCTS", () => {
  it("có đủ 3 phần mềm chuẩn", () => {
    const ids = PRODUCTS.map((p) => p.id);
    expect(ids).toContain("pmt-ems");
    expect(ids).toContain("google-workspace");
    expect(ids).toContain("tuyen-sinh");
  });
  it("getProduct trả đúng định nghĩa, id lạ -> undefined", () => {
    expect(getProduct("pmt-ems")?.label).toContain("PMT-EMS");
    expect(getProduct("khong-co")).toBeUndefined();
  });
});
