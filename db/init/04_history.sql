-- ============================================================
--  Sprint 5 — Lịch sử hội thoại + phản hồi
--  (gen_random_uuid() là hàm lõi của PostgreSQL >= 13, không cần extension)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    BIGINT REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,            -- 'user' | 'assistant'
  content         TEXT NOT NULL,
  citations       JSONB,
  product         TEXT,
  channel         TEXT DEFAULT 'web',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback (
  id         BIGSERIAL PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id    BIGINT REFERENCES users(id) ON DELETE CASCADE,
  rating     SMALLINT,                      -- 1 = 👍, -1 = 👎
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_user_idx ON conversations (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS feedback_message_idx ON feedback (message_id);
