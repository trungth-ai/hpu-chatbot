export const VALID_ROLES = ["sinh-vien", "cbgv", "phong-dao-tao", "admin"] as const;
export type Role = (typeof VALID_ROLES)[number];

export function isValidRole(r: unknown): r is Role {
  return typeof r === "string" && (VALID_ROLES as readonly string[]).includes(r);
}

export const ROLE_LABELS: Record<Role, string> = {
  "sinh-vien": "Sinh viên",
  cbgv: "Cán bộ / Giảng viên",
  "phong-dao-tao": "Phòng Đào tạo",
  admin: "Quản trị viên",
};
