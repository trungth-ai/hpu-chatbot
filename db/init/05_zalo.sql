-- ============================================================
--  Sprint 9 — Người dùng Zalo OA (kênh công khai)
-- ============================================================
CREATE TABLE IF NOT EXISTS zalo_users (
  zalo_user_id TEXT PRIMARY KEY,
  display_name TEXT,
  role         TEXT NOT NULL DEFAULT 'sinh-vien',
  created_at   TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);
