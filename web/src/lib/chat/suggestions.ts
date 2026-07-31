// Gợi ý câu hỏi nhanh (chip) theo vai trò người dùng — hàm THUẦN để test.
export interface Suggestion {
  label: string;
  prompt: string;
}

const COMMON: Suggestion[] = [
  { label: "Đổi mật khẩu", prompt: "Làm sao đổi mật khẩu tài khoản phần mềm?" },
  { label: "Quên mật khẩu", prompt: "Tôi quên mật khẩu đăng nhập thì phải làm gì?" },
];

const CBGV: Suggestion[] = [
  { label: "Nhập điểm", prompt: "Hướng dẫn nhập điểm trên PMT-EMS" },
  { label: "Xem thời khóa biểu", prompt: "Cách xem thời khóa biểu giảng dạy của tôi" },
  { label: "In danh sách lớp", prompt: "Làm sao in danh sách sinh viên của lớp học phần?" },
];

const SINH_VIEN: Suggestion[] = [
  { label: "Đăng ký học phần", prompt: "Hướng dẫn đăng ký học phần trên PMT-EMS" },
  { label: "Xem điểm", prompt: "Cách xem điểm và kết quả học tập của tôi" },
  { label: "Xem thời khóa biểu", prompt: "Làm sao xem thời khóa biểu của tôi?" },
  { label: "Tra cứu học phí", prompt: "Cách tra cứu công nợ học phí" },
];

const PHONG_DAO_TAO: Suggestion[] = [
  { label: "Quản lý lớp học phần", prompt: "Cách tạo và quản lý lớp học phần" },
  { label: "Kết xuất báo cáo", prompt: "Hướng dẫn kết xuất báo cáo đào tạo" },
];

/** Trả về tối đa 4 gợi ý phù hợp vai trò. */
export function suggestionsForRole(role?: string): Suggestion[] {
  let specific: Suggestion[];
  switch (role) {
    case "cbgv":
      specific = CBGV;
      break;
    case "sinh-vien":
      specific = SINH_VIEN;
      break;
    case "phong-dao-tao":
      specific = PHONG_DAO_TAO;
      break;
    case "admin":
      specific = [...CBGV, ...PHONG_DAO_TAO];
      break;
    default:
      specific = SINH_VIEN;
  }
  return [...specific, ...COMMON].slice(0, 4);
}
