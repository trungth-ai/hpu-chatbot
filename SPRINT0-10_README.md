# Trợ lý HPU — `chat.hpu.edu.vn`

Chatbot RAG hỗ trợ cán bộ – giảng viên – sinh viên Trường ĐH Quản lý và Công nghệ Hải Phòng sử dụng các phần mềm của trường (khởi điểm: PMT-EMS của ASC).

> **Trạng thái: 🎉 HOÀN TẤT — Sprint 0–10.** Hạ tầng · đăng nhập · chat · Drive + nạp tài liệu · RAG · lịch sử & phản hồi · quản trị · an toàn · đa phần mềm · Zalo OA · production & go-live.
>
> **Đã verify (regression toàn bộ):** TypeScript typecheck 0 lỗi · ESLint sạch · **130 unit test (web)** + 8 unit test (worker Python) pass · `next build` biên dịch toàn bộ route.
> Tài liệu vận hành: xem [`RUNBOOK.md`](./RUNBOOK.md) (gồm checklist go-live).

## Ngăn xếp
Next.js 14 (App Router, TS) · Tailwind · Auth.js v5 (Google) · PostgreSQL 16 + pgvector · Drizzle ORM · Docker + Caddy. Worker nạp tài liệu: Python (Google Drive API + Gemini).

## Cấu trúc
```
hpu-chatbot/
├── infra/        docker-compose.yml, Caddyfile (chat.hpu.edu.vn)
├── db/init/      01_schema.sql (pgvector + bảng users) — chạy khi DB rỗng
├── .github/      CI: lint + typecheck + test
└── web/          Next.js
    └── src/
        ├── auth.config.ts   cấu hình auth edge-safe (cho middleware)
        ├── auth.ts          cấu hình auth đầy đủ (Node, có DB)
        ├── middleware.ts    bảo vệ trang, đẩy về /login nếu chưa đăng nhập
        ├── app/             layout, /login, trang chính, /api/health, /api/auth
        ├── components/      HpuLogo, Button, GoogleIcon
        ├── lib/             auth (domain, users), db (drizzle), env
        └── tests/           Vitest (chặn miền + gán vai trò)
```

## Yêu cầu
- Docker + Docker Compose **hoặc** Node.js 20 + PostgreSQL 16 (kèm pgvector) để chạy local.
- Một **Google OAuth Client (Web)** — xem mục Google OAuth.

## 1) Cấu hình môi trường
```bash
cp .env.example .env
# Sửa: DB_PASSWORD, AUTH_SECRET (openssl rand -base64 32),
#      GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ADMIN_EMAILS, STUDENT_EMAIL_REGEX
# Local dev: đặt NEXTAUTH_URL=http://localhost:3000
```

## 2) Tạo Google OAuth Client
1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID → Web application**.
2. **Authorized redirect URIs**:
   - `https://chat.hpu.edu.vn/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (cho dev)
3. Lấy **Client ID/Secret** điền vào `.env`.
4. Khuyến nghị tạo trong project thuộc **Google Workspace HPU** để khóa nội bộ.

## 3a) Chạy bằng Docker (giống production)
```bash
docker compose -f infra/docker-compose.yml up -d --build
# DB tự chạy 01_schema.sql lần đầu. Truy cập:
#  - http://localhost:3000        (cổng web map sẵn để test)
#  - https://chat.hpu.edu.vn      (khi DNS A record -> 27.72.202.13 + mở 80/443)
docker compose -f infra/docker-compose.yml logs -f web
```
> Chạy local không cần domain: có thể tạm xóa service `caddy` trong compose.

## 3b) Chạy thuần Node (dev nhanh)
```bash
# Cần một PostgreSQL có pgvector; ví dụ chạy riêng DB bằng Docker:
docker run -d --name hpu-db -e POSTGRES_DB=hpu_chatbot -e POSTGRES_USER=hpu \
  -e POSTGRES_PASSWORD=secret -p 5432:5432 pgvector/pgvector:pg16
# Nạp schema:
docker exec -i hpu-db psql -U hpu -d hpu_chatbot < db/init/01_schema.sql

cd web
npm install
# .env: DATABASE_URL=postgresql://hpu:secret@localhost:5432/hpu_chatbot ; NEXTAUTH_URL=http://localhost:3000
npm run dev   # http://localhost:3000
```

## Kiểm thử & chất lượng
```bash
cd web
npm test         # Vitest: chặn miền + vai trò + gợi ý chat (18 test)
npm run lint
npm run typecheck
```
CI (GitHub Actions) chạy lint + typecheck + test trên mỗi push/PR.

## Kiểm tra nhanh khi chạy
- `GET /api/health` → `{ "status": "ok", "db": "ok" }`.
- Vào `/` khi chưa đăng nhập → tự chuyển `/login`.
- Đăng nhập Google `@hpu.edu.vn` → vào app. Email miền khác → bị chặn, hiện thông báo.

## Định nghĩa hoàn thành Sprint 0–1 (DoD)
- [x] `docker compose up` dựng web + db; HTTPS qua Caddy cho `chat.hpu.edu.vn`.
- [x] `/api/health` kiểm tra DB.
- [x] Chỉ Google `@hpu.edu.vn` đăng nhập được; lưu `users` + gán vai trò; admin theo `ADMIN_EMAILS`.
- [x] Trang được middleware bảo vệ.
- [x] Theme màu/font/logo theo brand HPU; test pass.

## ⚠️ Việc cần làm trước go-live
- Thay biểu tượng tạm trong `web/src/components/HpuLogo.tsx` bằng **logo chính thức** (đặt `logo-white.svg` vào `web/public/`).
- Chỉnh `STUDENT_EMAIL_REGEX` cho khớp định dạng email sinh viên thật của trường.

## Nạp tài liệu từ Google Drive (Sprint 3)
Xem hướng dẫn chi tiết trong `ingestion/README.md`. Tóm tắt: tạo Service Account → share thư mục Drive cho email SA → khai báo `drive_sources` → chạy:
```bash
docker compose -f infra/docker-compose.yml run --rm ingest python sync.py --all
```

## Chatbot trả lời thật (Sprint 4)
Endpoint `/api/chat` giờ chạy RAG thật: embedding câu hỏi → truy hồi `pgvector` (lọc theo phần mềm + vai trò; admin xem tất cả) → Gemini Flash sinh câu trả lời **bám tài liệu, có trích dẫn nguồn**, **stream từng chữ**. Nếu không đủ căn cứ (điểm tương đồng < `SIMILARITY_THRESHOLD`) → trả lời "chưa tìm thấy → liên hệ CNTT" và ghi vào `knowledge_gaps`.

**Để bot trả lời được, cần:** điền `GEMINI_API_KEY` trong `.env` và **nạp tài liệu** trước (xem mục Sprint 3). Sau đó hỏi thử "Cách nhập điểm trên PMT-EMS?" — bot trả lời kèm nguồn.

## Lịch sử & phản hồi (Sprint 5)
Hội thoại được lưu vào DB (`conversations`/`messages`/`feedback`): sidebar hiển thị lịch sử, bấm vào mở lại, xóa được; mỗi câu trả lời của bot có nút 👍/👎 và khối **Nguồn bấm mở được**. Mọi truy vấn đều **kiểm tra quyền sở hữu** (người dùng chỉ thấy/sửa hội thoại của chính mình).

API: `GET/POST /api/conversations`, `DELETE /api/conversations/:id`, `GET /api/conversations/:id/messages`, `POST /api/feedback`.

## Trang quản trị (Sprint 6)
`/admin` (chỉ admin — non-admin bị chuyển hướng + API trả 403). Ba tab:
- **Tài liệu:** thêm/bật-tắt/xóa nguồn Google Drive, xem số file & chunk, **nút "Đồng bộ ngay"** (gọi worker qua `INGEST_URL`).
- **Thống kê:** hội thoại, câu hỏi, người dùng, **tỉ lệ tự trả lời (containment)**, **tỉ lệ hài lòng 👍/👎**, lưu lượng theo phần mềm, danh sách **khoảng trống tri thức**.
- **Người dùng:** đổi vai trò (sinh-viên / CBGV / Phòng Đào tạo / admin).

Worker giờ chạy như **service** với HTTP trigger (`server.py`, cổng nội bộ 8787, chỉ dùng thư viện chuẩn). Đồng bộ thủ công vẫn được: `docker compose -f infra/docker-compose.yml run --rm ingest python sync.py --all`.

## An toàn & ổn định (Sprint 7)
- **Guardrail đầu vào** (chặn trước khi gọi Gemini): phát hiện **bẻ prompt** ("bỏ qua hướng dẫn", jailbreak…) và **dò dữ liệu cá nhân người khác** ("điểm của Nguyễn Văn A") → trả lời từ chối lịch sự. Đã test kỹ để **không chặn nhầm** câu hợp lệ ("đổi mật khẩu", "xem điểm của tôi").
- **Rate limit** mỗi người dùng (mặc định 20 câu/60s, chỉnh qua `CHAT_RATE_LIMIT`); vượt hạn → thông báo nhẹ nhàng (429).
- **Xử lý lỗi Gemini** (quá tải/timeout): xin lỗi + gợi ý thử lại, **không mất tin nhắn** người dùng, không trắng trang.
- System prompt bổ sung quy tắc từ chối PII bên thứ ba + câu ngoài phạm vi. Thêm **nút Sao chép** câu trả lời.

## Đa phần mềm & tuyển sinh (Sprint 8)
- **Bộ chọn phần mềm** trên thanh chat (Tự động / PMT-EMS / Email & Workspace / Tuyển sinh).
- **Tự định tuyến:** nếu để "Tự động", hệ thống đoán phần mềm từ câu hỏi (theo từ khóa) để truy hồi đúng phạm vi; không rõ thì tìm trên mọi phần mềm.
- **Tuyển sinh:** khi ở phần mềm `tuyen-sinh`, bot có thể gọi tool `lookup_admission_info(nganh, nam, loai)` để tra điểm chuẩn/chỉ tiêu/học phí. **Sprint 8 trả dữ liệu mẫu** — điểm cắm để giai đoạn sau ghép dữ liệu tuyển sinh thật.

### Playbook: thêm một phần mềm mới
1. Thêm 1 `ProductDef` vào `web/src/lib/rag/products.ts` (id, nhãn, từ khóa định tuyến).
2. Tạo thư mục Google Drive chứa tài liệu phần mềm đó, **share cho email Service Account**.
3. Vào `/admin` → tab **Tài liệu** → thêm nguồn với `product` = id vừa đặt.
4. Bấm **Đồng bộ ngay**. Xong — RAG đã bao phủ phần mềm mới (worker không cần sửa code).

## Kênh Zalo OA (Sprint 9)
- Webhook `POST /api/zalo/webhook` **xác thực chữ ký** (`X-ZEvent-Signature` = SHA256(appId+data+timestamp+OASecretKey)); chữ ký sai → 401. `GET` để Zalo xác minh.
- Dùng chung **lõi RAG** (`answerQuestion`): cùng guardrail, truy hồi, fallback, tool tuyển sinh như web.
- **Kênh công khai, không PII:** người dùng Zalo mặc định vai trò **sinh-viên**, phạm vi giới hạn theo `ZALO_ALLOWED_PRODUCTS` (mặc định `pmt-ems,tuyen-sinh`) — tự loại tài liệu nội bộ.
- Gửi trả lời qua Zalo OA API + **tự làm mới access token** khi 401; **rate limit** riêng cho mỗi user Zalo; cắt gọn tin dài.

Cấu hình: `ZALO_APP_ID`, `ZALO_APP_SECRET` (OA Secret Key), `ZALO_ACCESS_TOKEN`, `ZALO_REFRESH_TOKEN`, `ZALO_ALLOWED_PRODUCTS`. Trỏ webhook Zalo về `https://chat.hpu.edu.vn/api/zalo/webhook`.
> Lưu ý: access token làm mới đang lưu in-memory; production nên lưu DB/redis để không mất khi restart.

## Production & vận hành (Sprint 10)
- **Compose production** (`infra/docker-compose.prod.yml`): không hở cổng web ra ngoài (chỉ Caddy 80/443), `restart: always`, healthcheck DB.
- **Sao lưu DB tự động** (service `backup` + `infra/backup.sh`): `pg_dump` nén gzip định kỳ + xoay vòng theo `BACKUP_KEEP_DAYS`. Phục hồi: xem RUNBOOK.
- **Bảo mật:** security headers ở cả Next (`next.config.mjs`) và Caddy (HSTS, X-Frame-Options, nosniff, Referrer/Permissions-Policy; mẫu CSP kèm chú thích).
- **Logging an toàn** (`src/lib/log.ts`): chỉ ghi event/vai trò/độ trễ/kết quả dạng JSON 1 dòng — **không ghi nội dung câu hỏi/câu trả lời**, id người dùng được **băm**.
- **Kiểm thử tải** (`load/k6-chat.js`): k6, mục tiêu p95 < 800ms, lỗi < 1%.
- **RUNBOOK** (`RUNBOOK.md`): triển khai, vận hành thường gặp, khắc phục sự cố, cấu hình ngoài, **checklist go-live**.

---

## ✅ Dự án hoàn tất
Toàn bộ 11 sprint (0→10) đã xong và verify. Trước khi go-live cần chuẩn bị (chi tiết trong RUNBOOK mục 6): Google OAuth client + redirect URI · Service Account + share thư mục Drive · `GEMINI_API_KEY` + nạp tài liệu lần đầu · thông tin Zalo OA · thay logo chính thức · chỉnh `STUDENT_EMAIL_REGEX`.

> Lưu ý trung thực: phần phụ thuộc dịch vụ ngoài (Gemini, Google Drive/OAuth, Zalo, Google Fonts) chỉ kiểm chứng đầy đủ khi chạy ở môi trường thật của trường. Toàn bộ logic, truy vấn DB (mock) và biên dịch đã được verify trong quá trình phát triển.
