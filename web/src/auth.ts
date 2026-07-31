import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { resolveRole } from "@/lib/auth/domain";
import { upsertUser } from "@/lib/auth/users";
import { env } from "@/lib/env";

// Instance ĐẦY ĐỦ (chạy ở Node) — có truy cập DB trong callback jwt.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account, profile }) {
      // Chỉ chạy khi đăng nhập lần đầu (account chỉ có ở lần đăng nhập)
      if (account && profile) {
        const email = String(profile.email).toLowerCase();
        const { role, isAdmin } = resolveRole(email, {
          adminEmails: env.ADMIN_EMAILS,
          studentRegex: env.STUDENT_EMAIL_REGEX,
        });
        const dbUser = await upsertUser({
          googleSub: String(profile.sub ?? account.providerAccountId),
          email,
          name: (profile.name as string) ?? null,
          picture: (profile.picture as string) ?? null,
          role,
          isAdmin,
        });
        // Lấy vai trò THỰC TẾ từ DB (tôn trọng chỉnh tay của admin sau này)
        token.role = dbUser.role;
        token.isAdmin = dbUser.isAdmin;
        token.email = dbUser.email;
        token.uid = dbUser.id;
      }
      return token;
    },
  },
});
