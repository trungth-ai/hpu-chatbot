import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Middleware dùng instance edge-safe (chỉ authConfig, không chạm DB).
// Callback "authorized" trong authConfig quyết định việc redirect về /login.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
  // Không cần xử lý thêm — "authorized" đã lo việc bảo vệ trang.
  void req;
});

export const config = {
  // Bảo vệ TẤT CẢ trang, trừ: /api (API tự kiểm tra auth trong handler),
  // tài nguyên tĩnh của Next, và file ảnh.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
