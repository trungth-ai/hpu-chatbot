-- ============================================================
--  HPU Chatbot — Schema khởi tạo (chạy tự động khi DB rỗng)
--  Sprint 0: extension pgvector + bảng users
--  (Bảng kho tri thức kb_documents... sẽ thêm ở Sprint 3)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  google_sub  TEXT UNIQUE NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  picture     TEXT,
  role        TEXT NOT NULL DEFAULT 'sinh-vien',   -- 'cbgv' | 'sinh-vien' | 'phong-dao-tao' | 'admin'
  is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  last_login  TIMESTAMPTZ
);
