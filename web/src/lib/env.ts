// Đọc & chuẩn hóa biến môi trường liên quan tới xác thực.

function parseAdminEmails(v?: string): string[] {
  return (v ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseRegex(v?: string): RegExp | undefined {
  if (!v) return undefined;
  try {
    return new RegExp(v);
  } catch {
    console.warn("STUDENT_EMAIL_REGEX không hợp lệ, bỏ qua:", v);
    return undefined;
  }
}

export const env = {
  ALLOWED_HD: process.env.ALLOWED_HD ?? "hpu.edu.vn",
  ADMIN_EMAILS: parseAdminEmails(process.env.ADMIN_EMAILS),
  STUDENT_EMAIL_REGEX: parseRegex(process.env.STUDENT_EMAIL_REGEX),
};
