# RUNBOOK — Trợ lý HPU (chat.hpu.edu.vn)

Tài liệu vận hành cho hệ thống chatbot hỗ trợ phần mềm HPU. Dùng cho người quản trị máy chủ.

Kiến trúc tóm tắt: **Caddy** (HTTPS) → **web** (Next.js, RAG + chat) → **db** (PostgreSQL + pgvector). **ingest** (Python) nạp tài liệu từ Google Drive vào DB. Kênh **Zalo OA** gọi vào `/api/zalo/webhook`.

---

## 1. Triển khai lần đầu (production)

```bash
git clone <repo> && cd hpu-chatbot
cp .env.example .env          # rồi điền đầy đủ (xem mục 2)
docker compose -f infra/docker-compose.prod.yml up -d --build
docker compose -f infra/docker-compose.prod.yml ps   # kiểm tra tất cả "healthy"
```

- DNS: bản ghi A `chat.hpu.edu.vn` → `27.72.202.13`; mở cổng **80** và **443** về máy chủ. Caddy tự xin chứng chỉ HTTPS.
- Kiểm tra nhanh: `curl https://chat.hpu.edu.vn/api/health` → `{"status":"ok","db":"ok"}`.

## 2. Biến môi trường bắt buộc (`.env`)

| Nhóm | Biến | Ghi chú |
|---|---|---|
| DB | `DB_PASSWORD`, `DATABASE_URL` | URL dạng `postgresql://hpu:<pass>@db:5432/hpu_chatbot` |
| Auth | `AUTH_SECRET` | sinh bằng `openssl rand -base64 32` |
| | `NEXTAUTH_URL` | `https://chat.hpu.edu.vn` |
| | `GOOGLE_CLIENT_ID/SECRET` | OAuth client (mục 6) |
| | `ALLOWED_HD=hpu.edu.vn` | chỉ cho đăng nhập email @hpu.edu.vn |
| | `ADMIN_EMAILS` | danh sách email admin, phẩy ngăn cách |
| Gemini | `GEMINI_API_KEY` | bắt buộc để bot trả lời + nạp tài liệu |
| Drive | `GOOGLE_SA_KEY_BASE64` | key Service Account (base64) |
| Zalo | `ZALO_APP_ID/APP_SECRET/ACCESS_TOKEN/REFRESH_TOKEN` | `APP_SECRET` = OA Secret Key |
| Backup | `BACKUP_INTERVAL_SECONDS=86400`, `BACKUP_KEEP_DAYS=14` | mặc định 1 ngày/lần, giữ 14 ngày |

## 3. Vận hành thường gặp

**Nạp / cập nhật tài liệu (đồng bộ Drive):**
- Qua giao diện: `/admin` → tab **Tài liệu** → **Đồng bộ ngay**.
- Qua CLI: `docker compose -f infra/docker-compose.prod.yml run --rm ingest python sync.py --all`
- Nạp tăng dần theo md5/thời gian sửa — chạy lại an toàn, không trùng lặp.

**Xem log (không chứa nội dung câu hỏi/PII — chỉ event, vai trò, độ trễ, kết quả):**
```bash
docker compose -f infra/docker-compose.prod.yml logs -f web      # log ứng dụng (JSON 1 dòng/sự kiện)
docker compose -f infra/docker-compose.prod.yml logs -f ingest   # log nạp tài liệu
docker compose -f infra/docker-compose.prod.yml logs -f backup   # log sao lưu
```

**Khởi động lại / cập nhật mã:**
```bash
docker compose -f infra/docker-compose.prod.yml restart web
git pull && docker compose -f infra/docker-compose.prod.yml up -d --build web
```

**Sao lưu & phục hồi DB:**
- Bản sao lưu tự động nằm ở `./backups/hpu_YYYYmmdd_HHMM.sql.gz` (service `backup`).
- Sao lưu thủ công: `docker compose -f infra/docker-compose.prod.yml exec db pg_dump "$DATABASE_URL" | gzip > backups/manual_$(date +%F).sql.gz`
- **Phục hồi:** `gunzip -c backups/hpu_XXXX.sql.gz | docker compose -f infra/docker-compose.prod.yml exec -T db psql "$DATABASE_URL"`

**Xoay vòng bí mật (rò rỉ key):** cập nhật giá trị mới trong `.env` → `docker compose -f infra/docker-compose.prod.yml up -d web ingest`. Với `GEMINI_API_KEY`/Google/Zalo: tạo key mới ở nhà cung cấp, thu hồi key cũ.

## 4. Kiểm thử tải

```bash
k6 run -e BASE_URL=https://chat.hpu.edu.vn load/k6-chat.js
```
Ngưỡng đạt: p95 < 800ms, tỉ lệ lỗi < 1%. (Mặc định đánh `/api/health`; đo `/api/chat` cần cookie phiên — xem chú thích trong script.)

## 5. Khắc phục sự cố

| Hiện tượng | Kiểm tra |
|---|---|
| **Không đăng nhập được** | `NEXTAUTH_URL` đúng domain HTTPS? Redirect URI trong Google Console khớp `https://chat.hpu.edu.vn/api/auth/callback/google`? Email có đuôi `@hpu.edu.vn`? `AUTH_SECRET` đã đặt? |
| **Bot luôn "chưa tìm thấy tài liệu"** | Đã đồng bộ Drive chưa (`/admin` → Thống kê xem số tài liệu)? Thư mục Drive đã share cho email Service Account? `GEMINI_API_KEY` hợp lệ (embedding)? |
| **Bot báo lỗi kỹ thuật khi trả lời** | `GEMINI_API_KEY` còn hạn mức? Xem `logs web` có `chat_error`? Gemini có thể đang quá tải — thử lại. |
| **Zalo không phản hồi** | Webhook trỏ đúng `https://chat.hpu.edu.vn/api/zalo/webhook`? `ZALO_APP_SECRET` = OA Secret Key (nếu sai → 401 chữ ký)? `ZALO_ACCESS_TOKEN` còn hạn (hệ thống tự refresh khi 401, nhưng cần `ZALO_REFRESH_TOKEN`)? |
| **HTTPS không lên** | Cổng 80/443 đã mở? DNS đã trỏ đúng IP? Xem `logs caddy`. |
| **DB không kết nối** | `docker compose ... ps` xem `db` healthy? `DATABASE_URL` đúng host `db`? |

## 6. Cấu hình ngoài (làm trước go-live)

- **Google OAuth:** tạo OAuth Client (Web), thêm Authorized redirect URI `https://chat.hpu.edu.vn/api/auth/callback/google`; điền `GOOGLE_CLIENT_ID/SECRET`.
- **Service Account (Drive):** tạo SA, bật Drive API, tải JSON → `base64 -w0 key.json` đặt vào `GOOGLE_SA_KEY_BASE64`; **share các thư mục tài liệu cho email SA**.
- **Gemini:** lấy `GEMINI_API_KEY` (Google AI Studio).
- **Zalo OA:** lấy App ID, OA Secret Key, Access/Refresh Token; trỏ webhook về domain.

---

## ✅ Checklist GO-LIVE

- [ ] `.env` điền đầy đủ; `AUTH_SECRET` ngẫu nhiên; `ADMIN_EMAILS` đúng người.
- [ ] DNS `chat.hpu.edu.vn` trỏ đúng IP; cổng 80/443 mở; HTTPS lên xanh.
- [ ] `curl /api/health` trả `db: ok`.
- [ ] Google OAuth redirect URI khớp; đăng nhập thử bằng 1 tài khoản @hpu.edu.vn.
- [ ] Service Account đã share thư mục Drive; chạy đồng bộ; `/admin` → Thống kê thấy số tài liệu > 0.
- [ ] Hỏi thử 3–5 câu thật (PMT-EMS, email, tuyển sinh) → có trích dẫn đúng; câu ngoài phạm vi → từ chối lịch sự.
- [ ] Thử dò dữ liệu cá nhân người khác → bot từ chối (guardrail).
- [ ] Logo chính thức đã thay (`web/public/logo-white.svg`); regex email sinh viên (`STUDENT_EMAIL_REGEX`) khớp thực tế.
- [ ] Zalo OA: nhắn thử từ Zalo → bot trả lời; chữ ký webhook hợp lệ.
- [ ] Sao lưu chạy (`logs backup` thấy file `.sql.gz`); thử phục hồi vào DB tạm.
- [ ] (Khuyến nghị) gắn uptime monitor đánh `/api/health`; cân nhắc lưu token Zalo đã refresh vào DB/redis.
