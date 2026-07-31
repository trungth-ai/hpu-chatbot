// Thực thi tool lookup_admission_info — Sprint 8 trả DỮ LIỆU MẪU.
// Giai đoạn sau: thay bằng truy vấn dữ liệu tuyển sinh thật (điểm chuẩn/chỉ tiêu/học phí).

export interface AdmissionArgs {
  nganh?: string;
  nam?: number;
  loai?: string; // diem_chuan | chi_tieu | hoc_phi | tong_hop
}

export function lookupAdmissionInfo(args: AdmissionArgs): Record<string, unknown> {
  const nam = args.nam ?? new Date().getFullYear();
  return {
    nganh: args.nganh ?? "(chưa rõ ngành)",
    nam,
    loai: args.loai ?? "tong_hop",
    diem_chuan: null,
    chi_tieu: null,
    hoc_phi: null,
    ket_qua: "DỮ LIỆU MẪU — tính năng tra cứu số liệu tuyển sinh đang được hoàn thiện",
    ghi_chu:
      "Vui lòng xác nhận số liệu chính thức với Phòng Tuyển sinh HPU hoặc website tuyển sinh của trường.",
  };
}
