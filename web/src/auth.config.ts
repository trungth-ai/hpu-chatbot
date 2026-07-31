import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { isAllowedEmail } from "@/lib/auth/domain";

const ALLOWED_HD = process.env.ALLOWED_HD ?? "hpu.edu.vn";

// Cấu hình AN TOÀN cho edge (middleware) — KHÔNG import gì chạm tới DB.
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Gợi ý Google chỉ hiện tài khoản thuộc miền hpu.edu.vn
      authorization: { params: { hd: ALLOWED_HD, prompt: "select_account" } },
    }),
  ],
  callbacks: {
    // Chặn đăng nhập nếu email không thuộc miền cho phép (hàm thuần, chạy ở edge OK)
    signIn({ profile, user }) {
      const email = (profile?.email ?? user?.email) as string | undefined;
      return isAllowedEmail(email, ALLOWED_HD);
    },
    // Bảo vệ trang (dùng bởi middleware): chưa đăng nhập -> đẩy về /login
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/login")) return true;
      return isLoggedIn;
    },
    // Đưa role/isAdmin từ token (được set ở auth.ts) vào session
    session({ session, token }) {
      if (session.user) {
        session.user.uid = token.uid as number | undefined;
        session.user.role = (token.role as string) ?? "sinh-vien";
        session.user.isAdmin = (token.isAdmin as boolean) ?? false;
      }
      return session;
    },
  },
};
