-- Lớp 2 bộ nhớ hội thoại: thêm 2 cột (an toàn, không mất dữ liệu)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary_upto INT DEFAULT 0;
