import { describe, it, expect } from "vitest";
import { lookupAdmissionInfo } from "@/lib/rag/admission";
import { admissionTool } from "@/lib/rag/gemini";

describe("lookupAdmissionInfo — tool tuyển sinh (Sprint 8, mock)", () => {
  it("phản hồi lại tham số đầu vào", () => {
    const r = lookupAdmissionInfo({ nganh: "CNTT", nam: 2026, loai: "diem_chuan" });
    expect(r.nganh).toBe("CNTT");
    expect(r.nam).toBe(2026);
    expect(r.loai).toBe("diem_chuan");
  });
  it("thiếu năm -> mặc định năm hiện tại", () => {
    const r = lookupAdmissionInfo({ nganh: "Ngôn ngữ Trung" });
    expect(r.nam).toBe(new Date().getFullYear());
    expect(r.loai).toBe("tong_hop");
  });
  it("đánh dấu rõ là dữ liệu mẫu + có ghi chú xác minh", () => {
    const r = lookupAdmissionInfo({ nganh: "QTKD" });
    expect(String(r.ket_qua)).toContain("MẪU");
    expect(String(r.ghi_chu)).toContain("Tuyển sinh");
    expect(r.diem_chuan).toBeNull();
  });
});

describe("admissionTool — định nghĩa tool cho Gemini", () => {
  it("đúng tên hàm + tham số bắt buộc", () => {
    const fn = admissionTool.functionDeclarations?.[0];
    expect(fn?.name).toBe("lookup_admission_info");
    expect(fn?.parameters?.required).toContain("nganh");
    expect(Object.keys(fn?.parameters?.properties ?? {})).toEqual(
      expect.arrayContaining(["nganh", "nam", "loai"]),
    );
  });
});
