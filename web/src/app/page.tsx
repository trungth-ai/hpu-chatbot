import { auth } from "@/auth";
import { ChatApp } from "@/components/chat/ChatApp";

// Trang chính (đã được middleware bảo vệ). Lấy thông tin người dùng từ session
// rồi giao cho ChatApp (client) điều phối giao diện.
export default async function Home() {
  const session = await auth();
  const user = {
    name: session?.user?.name,
    image: session?.user?.image,
    role: session?.user?.role,
    isAdmin: session?.user?.isAdmin,
  };
  return <ChatApp user={user} />;
}
