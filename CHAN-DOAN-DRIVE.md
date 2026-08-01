# Chẩn đoán vì sao nguồn Drive mới = 0 file

## Nguyên nhân gần như chắc chắn
Anh nói thư mục "được share cho MÌNH quyền truy cập". Mấu chốt: chatbot đọc Drive
bằng **Service Account** (một tài khoản robot RIÊNG), KHÔNG phải tài khoản Google
của anh. **Share cho anh ≠ share cho robot.** Robot chỉ đọc được khi thư mục được
share trực tiếp cho **email của Service Account** (hoặc robot là thành viên Shared Drive).

## Xác minh trong 2 lệnh (chạy trên server)

```bash
cd ~/trungth/hpu-chatbot

# 1) Lấy email Service Account — ĐÂY là email phải được share vào thư mục:
docker compose -f infra/docker-compose.prod.yml exec ingest python -c "import os,base64,json;print('SA email:', json.loads(base64.b64decode(os.environ['GOOGLE_SA_KEY_BASE64']))['client_email'])"

# 2) Thử cho Service Account liệt kê thư mục sách giáo khoa (thay <FOLDER_ID>):
docker compose -f infra/docker-compose.prod.yml exec ingest python -c "
import os
from hpu_ingest import drive
svc = drive.get_drive_service(os.environ['GOOGLE_SA_KEY_BASE64'])
files = drive.list_files_recursive(svc, '<FOLDER_ID>')
print('Service Account thấy', len(files), 'file')
[print(' -', f['name']) for f in files[:10]]
"
```

## Đọc kết quả
- Lệnh 2 in **"... thấy 0 file"** → đúng như dự đoán: robot KHÔNG thấy thư mục.
  → Vào Google Drive, mở thư mục sách giáo khoa → **Chia sẻ** → thêm **email ở Lệnh 1**
    (quyền *Người xem*). Nếu là **Shared Drive (bộ nhớ dùng chung)** thì vào phần thành
    viên của Shared Drive và thêm email đó.
  → Rồi đồng bộ lại: `docker compose ... exec ingest python sync.py --all`
- Lệnh 2 in **"... thấy N file" (N>0)** → robot ĐÃ thấy; 0 file trên admin là do khác
  (kiểm tra Folder ID trong nguồn có đúng thư mục này không, rồi đồng bộ lại).

## Lưu ý
- Folder ID chỉ là phần mã trong URL: `drive.google.com/drive/folders/<CHÍNH_LÀ_ID>` — không dán cả URL.
- Sau khi robot thấy file + đồng bộ có chunk, collection "Sách giáo khoa" sẽ TỰ hiện trong ô chọn (nhờ danh mục động).
