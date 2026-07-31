import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HpuLogo } from "@/components/HpuLogo";
import { SignInButton } from "./SignInButton";

const ALLOWED_HD = process.env.ALLOWED_HD ?? "hpu.edu.vn";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  // Đã đăng nhập thì vào thẳng app
  const session = await auth();
  if (session?.user) redirect("/");

  const accessDenied = searchParams?.error === "AccessDenied";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-hpu-dark to-hpu-primary px-4">
      {/* Hoa văn "nét bay" mờ của thương hiệu */}
      <HpuLogo className="pointer-events-none absolute -right-16 -bottom-10 h-[28rem] w-[28rem] text-white/10" />

      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
        <div className="flex flex-col items-center text-center">
          <HpuLogo className="h-16 w-16 text-hpu-primary" />
          <h1 className="mt-5 text-2xl font-bold text-hpu-ink">Trợ lý HPU</h1>
          <p className="mt-2 text-sm leading-relaxed text-hpu-muted">
            Trợ lý ảo hướng dẫn sử dụng phần mềm của Trường ĐH Quản lý và Công
            nghệ Hải Phòng. Đăng nhập bằng tài khoản{" "}
            <span className="font-semibold text-hpu-dark">@{ALLOWED_HD}</span>.
          </p>
        </div>

        {accessDenied && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Tài khoản này không thuộc miền <strong>@{ALLOWED_HD}</strong> nên
            chưa được phép truy cập. Vui lòng dùng email do nhà trường cấp.
          </div>
        )}

        <div className="mt-8">
          <SignInButton />
        </div>

        <p className="mt-6 text-center text-xs text-hpu-muted">
          Gặp sự cố đăng nhập? Liên hệ Phòng QTM (gặp anh Phóng – 0399 803 785).
        </p>
      </div>
    </main>
  );
}
