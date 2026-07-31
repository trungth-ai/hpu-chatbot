# Worker nạp tài liệu (Sprint 3)

Đồng bộ tài liệu từ **Google Drive** vào kho tri thức `pgvector`:
`Drive → tải/parse (PDF, DOCX, Google Doc, ảnh) → chú thích ảnh (Gemini Vision) → chunk → embedding (text-embedding-004) → kb_documents`.

## Chuẩn bị (một lần)
1. **Service Account:** Google Cloud → bật **Drive API** → tạo Service Account → tạo JSON key.
2. **Chia sẻ thư mục:** share các thư mục tài liệu cho **email của Service Account** (quyền *Viewer*).
3. Mã hóa key và đưa vào `.env`:
   ```bash
   base64 -w0 sa-key.json   # dán kết quả vào GOOGLE_SA_KEY_BASE64
   ```
4. Khai báo nguồn tài liệu trong bảng `drive_sources` (mỗi thư mục = 1 bộ tài liệu):
   ```sql
   INSERT INTO drive_sources (folder_id, product, module, role_scope, version)
   VALUES ('<ID_thư_mục_Drive>', 'pmt-ems', 'dao-tao', ARRAY['all'], 'v1');
   ```
   (Từ Sprint 6, admin thêm/sửa nguồn này qua giao diện web.)

## Chạy đồng bộ
```bash
# Qua Docker Compose (khuyến nghị):
docker compose -f infra/docker-compose.yml run --rm ingest python sync.py --all

# Hoặc 1 nguồn cụ thể:
docker compose -f infra/docker-compose.yml run --rm ingest python sync.py --source 1
```
Đồng bộ **incremental**: file không đổi (md5/modifiedTime) sẽ được bỏ qua; file mới/đổi sẽ thay chunk cũ.

## Kiểm thử
```bash
cd ingestion && pip install pytest && python -m pytest tests/ -v   # 8 test logic chunk
```

## Module
- `hpu_ingest/chunker.py` — cắt chunk (thuần, có test)
- `hpu_ingest/drive.py` — Drive client (Service Account)
- `hpu_ingest/parse.py` — parse PDF/DOCX/text
- `hpu_ingest/embed.py` — embedding + chú thích ảnh (Gemini)
- `hpu_ingest/db.py` — upsert pgvector (incremental)
- `sync.py` — điểm chạy chính
