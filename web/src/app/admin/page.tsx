import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminDashboard } from "./AdminDashboard";

// Chỉ admin mới vào được. API admin cũng tự chặn 403 (bảo vệ 2 lớp).
export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/");
  return <AdminDashboard />;
}
