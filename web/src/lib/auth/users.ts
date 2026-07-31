import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

interface UpsertUserInput {
  googleSub: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: string;
  isAdmin: boolean;
}

/**
 * Tạo mới hoặc cập nhật user khi đăng nhập.
 * Lưu ý: KHÔNG ghi đè role/is_admin khi đã tồn tại — để admin chỉnh tay (Sprint 6)
 * vẫn được giữ. Trả về bản ghi hiện tại để token lấy vai trò ĐÚNG theo DB.
 */
export async function upsertUser(input: UpsertUserInput): Promise<User> {
  const now = new Date();
  const [row] = await db
    .insert(users)
    .values({
      googleSub: input.googleSub,
      email: input.email,
      name: input.name,
      picture: input.picture,
      role: input.role,
      isAdmin: input.isAdmin,
      lastLogin: now,
    })
    .onConflictDoUpdate({
      target: users.googleSub,
      set: { name: input.name, picture: input.picture, lastLogin: now },
    })
    .returning();
  return row;
}
