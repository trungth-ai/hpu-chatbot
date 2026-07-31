import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      uid?: number; // id người dùng trong DB (bigint) — không trùng "id" (string) của NextAuth
      role?: string;
      isAdmin?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: number;
    role?: string;
    isAdmin?: boolean;
  }
}
