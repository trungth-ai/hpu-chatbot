import type { Session } from "next-auth";

/** Phiên hiện tại có phải admin không (thuần, dễ test). */
export function isAdminSession(session: Session | null): boolean {
  return Boolean(session?.user?.isAdmin);
}
