import { pool } from "@/lib/db";

/** Tạo/cập nhật người dùng Zalo, trả về vai trò (mặc định sinh-vien). */
export async function upsertZaloUser(
  zaloUserId: string,
  displayName: string | null = null,
): Promise<string> {
  const r = await pool.query(
    `INSERT INTO zalo_users (zalo_user_id, display_name)
     VALUES ($1, $2)
     ON CONFLICT (zalo_user_id) DO UPDATE
       SET last_seen_at = now(),
           display_name = COALESCE(EXCLUDED.display_name, zalo_users.display_name)
     RETURNING role`,
    [zaloUserId, displayName],
  );
  return r.rows[0].role;
}
