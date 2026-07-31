-- ============================================================
--  Sprint 4 — Ghi nhận câu hỏi chưa trả lời được (khoảng trống tri thức)
--  (conversations / messages / feedback sẽ thêm ở Sprint 5)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_gaps (
  id         BIGSERIAL PRIMARY KEY,
  question   TEXT NOT NULL,
  product    TEXT,
  role       TEXT,
  channel    TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT now()
);
