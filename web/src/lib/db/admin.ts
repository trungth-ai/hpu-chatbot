import { pool } from "@/lib/db";

export interface DriveSourceRow {
  id: number;
  folderId: string;
  product: string;
  module: string | null;
  roleScope: string[];
  version: string | null;
  enabled: boolean;
  lastSyncedAt: string | null;
  fileCount: number;
  chunkCount: number;
}

export async function listDriveSources(): Promise<DriveSourceRow[]> {
  const r = await pool.query(
    `SELECT s.id, s.folder_id, s.product, s.module, s.role_scope, s.version,
            s.enabled, s.last_synced_at,
            (SELECT count(*) FROM drive_files f WHERE f.source_id = s.id) AS file_count,
            (SELECT count(*) FROM kb_documents k WHERE k.product = s.product) AS chunk_count
     FROM drive_sources s
     ORDER BY s.id`,
  );
  return r.rows.map((x) => ({
    id: x.id,
    folderId: x.folder_id,
    product: x.product,
    module: x.module,
    roleScope: x.role_scope,
    version: x.version,
    enabled: x.enabled,
    lastSyncedAt: x.last_synced_at,
    fileCount: Number(x.file_count),
    chunkCount: Number(x.chunk_count),
  }));
}

export async function createDriveSource(s: {
  folderId: string;
  product: string;
  module: string | null;
  roleScope: string[];
  version: string | null;
}): Promise<number> {
  const r = await pool.query(
    `INSERT INTO drive_sources (folder_id, product, module, role_scope, version)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [s.folderId, s.product, s.module, s.roleScope, s.version],
  );
  return r.rows[0].id;
}

export async function setDriveSourceEnabled(id: number, enabled: boolean): Promise<void> {
  await pool.query("UPDATE drive_sources SET enabled = $2 WHERE id = $1", [id, enabled]);
}

export async function deleteDriveSource(id: number): Promise<boolean> {
  const r = await pool.query("DELETE FROM drive_sources WHERE id = $1", [id]);
  return (r.rowCount ?? 0) > 0;
}

// ----- Người dùng -----
export interface AdminUserRow {
  id: number;
  email: string;
  name: string | null;
  role: string;
  isAdmin: boolean;
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const r = await pool.query(
    "SELECT id, email, name, role, is_admin FROM users ORDER BY created_at DESC LIMIT 500",
  );
  return r.rows.map((x) => ({
    id: x.id,
    email: x.email,
    name: x.name,
    role: x.role,
    isAdmin: x.is_admin,
  }));
}

export async function updateUserRole(
  id: number,
  role: string,
  isAdmin: boolean,
): Promise<void> {
  await pool.query("UPDATE users SET role = $2, is_admin = $3 WHERE id = $1", [id, role, isAdmin]);
}

// ----- Thống kê -----
export interface Overview {
  conversations: number;
  messages: number;
  users: number;
  userMessages: number;
  thumbsUp: number;
  thumbsDown: number;
  gaps: number;
}

export async function getOverview(): Promise<Overview> {
  const r = await pool.query(`
    SELECT
      (SELECT count(*) FROM conversations) AS conversations,
      (SELECT count(*) FROM messages) AS messages,
      (SELECT count(*) FROM users) AS users,
      (SELECT count(*) FROM messages WHERE role = 'user') AS user_messages,
      (SELECT count(*) FROM feedback WHERE rating = 1) AS thumbs_up,
      (SELECT count(*) FROM feedback WHERE rating = -1) AS thumbs_down,
      (SELECT count(*) FROM knowledge_gaps) AS gaps
  `);
  const x = r.rows[0];
  return {
    conversations: Number(x.conversations),
    messages: Number(x.messages),
    users: Number(x.users),
    userMessages: Number(x.user_messages),
    thumbsUp: Number(x.thumbs_up),
    thumbsDown: Number(x.thumbs_down),
    gaps: Number(x.gaps),
  };
}

export async function usageByProduct(): Promise<{ product: string; count: number }[]> {
  const r = await pool.query(
    `SELECT COALESCE(product, '(không rõ)') AS product, count(*) AS count
     FROM messages WHERE role = 'assistant'
     GROUP BY product ORDER BY count DESC`,
  );
  return r.rows.map((x) => ({ product: x.product, count: Number(x.count) }));
}

export async function recentGaps(
  limit = 50,
): Promise<{ question: string; product: string | null; role: string | null; createdAt: string }[]> {
  const r = await pool.query(
    `SELECT question, product, role, created_at FROM knowledge_gaps
     ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  return r.rows.map((x) => ({
    question: x.question,
    product: x.product,
    role: x.role,
    createdAt: x.created_at,
  }));
}


/** Các product ĐANG CÓ nội dung trong kho (>=1 chunk) — để dựng bộ chọn động. */
export async function listActiveProducts(): Promise<{ product: string; count: number }[]> {
  const r = await pool.query(
    `SELECT product, count(*)::int AS count
       FROM kb_documents
      WHERE product IS NOT NULL AND product <> ''
      GROUP BY product
      ORDER BY count DESC`,
  );
  return r.rows.map((x) => ({ product: x.product, count: Number(x.count) }));
}
