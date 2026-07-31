-- ============================================================
--  Sprint 3 — Kho tri thức + cấu hình nguồn Google Drive
-- ============================================================

-- Khai báo bộ tài liệu trên Drive (mỗi thư mục = 1 bộ tài liệu phần mềm)
CREATE TABLE IF NOT EXISTS drive_sources (
  id             BIGSERIAL PRIMARY KEY,
  folder_id      TEXT NOT NULL,
  product        TEXT NOT NULL,                 -- 'pmt-ems','google-workspace','dspace','tuyen-sinh'...
  module         TEXT,
  role_scope     TEXT[] NOT NULL DEFAULT '{all}',
  version        TEXT,
  last_synced_at TIMESTAMPTZ,
  enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Trạng thái đồng bộ từng file (để đồng bộ incremental)
CREATE TABLE IF NOT EXISTS drive_files (
  id            BIGSERIAL PRIMARY KEY,
  source_id     BIGINT REFERENCES drive_sources(id) ON DELETE CASCADE,
  drive_file_id TEXT UNIQUE NOT NULL,
  name          TEXT,
  mime_type     TEXT,
  md5           TEXT,                            -- md5Checksum hoặc modifiedTime
  synced_at     TIMESTAMPTZ
);

-- Tri thức đã chunk + vector
CREATE TABLE IF NOT EXISTS kb_documents (
  id            BIGSERIAL PRIMARY KEY,
  product       TEXT NOT NULL,
  module        TEXT,
  role_scope    TEXT[] NOT NULL DEFAULT '{all}',
  version       TEXT,
  drive_file_id TEXT,
  source_file   TEXT,
  source_url    TEXT,
  page          INT,
  section       TEXT,
  image_url     TEXT,
  content       TEXT NOT NULL,
  content_tsv   TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,
  embedding     VECTOR(768),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kb_documents_embedding_idx
  ON kb_documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS kb_documents_product_idx ON kb_documents (product, module);
CREATE INDEX IF NOT EXISTS kb_documents_role_idx ON kb_documents USING gin (role_scope);
CREATE INDEX IF NOT EXISTS kb_documents_tsv_idx ON kb_documents USING gin (content_tsv);
