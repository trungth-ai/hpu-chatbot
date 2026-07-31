// Logic xác thực miền & gán vai trò — hàm THUẦN (không phụ thuộc DB) để dễ test.

/**
 * Kiểm tra email có thuộc miền cho phép không (vd "hpu.edu.vn").
 * Chặn các trường hợp lừa: email rỗng, nhiều dấu @, subdomain giả mạo.
 */
export function isAllowedEmail(
  email: string | null | undefined,
  allowedHd: string,
): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  const hd = allowedHd.trim().toLowerCase();
  // Chỉ chấp nhận đúng một dấu @ và đuôi đúng "@<miền>"
  if (e.indexOf("@") !== e.lastIndexOf("@")) return false;
  return e.endsWith(`@${hd}`);
}

export interface ResolveRoleOptions {
  adminEmails: string[];
  studentRegex?: RegExp;
}

export type UserRole = "admin" | "cbgv" | "sinh-vien" | "phong-dao-tao";

/**
 * Suy ra vai trò ban đầu từ email:
 *  - Trong danh sách admin  -> "admin" (is_admin = true)
 *  - Khớp mẫu email sinh viên -> "sinh-vien"
 *  - Còn lại -> "cbgv"
 * (Admin có thể chỉnh vai trò sau ở Sprint 6; lúc đó token đọc vai trò từ DB.)
 */
export function resolveRole(
  email: string,
  opts: ResolveRoleOptions,
): { role: UserRole; isAdmin: boolean } {
  const e = email.trim().toLowerCase();
  if (opts.adminEmails.map((a) => a.toLowerCase()).includes(e)) {
    return { role: "admin", isAdmin: true };
  }
  if (opts.studentRegex && opts.studentRegex.test(e)) {
    return { role: "sinh-vien", isAdmin: false };
  }
  return { role: "cbgv", isAdmin: false };
}
