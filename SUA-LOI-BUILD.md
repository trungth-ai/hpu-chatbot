# SỬA LỖI BUILD — nguyên nhân & cách khắc phục

## Nguyên nhân (2 lỗi, đều do TÊN FILE)
1. **File route đặt sai tên.** File em giao tên là `route-api-chat.ts` / `route-api-products.ts`
   (đặt vậy để không trùng khi để chung 1 thư mục tải về). Nhưng trong Next.js, file API route
   **BẮT BUỘC** tên `route.ts`. Anh chép nguyên tên `route-api-chat.ts` vào thư mục nên:
   - `api/chat/` bị **3 file**: `route.ts` (cũ) + `route-api-chat.ts` (mới, sai tên) + `route.ts.old`.
     Next vẫn biên dịch `route-api-chat.ts` → nó import hàm chưa có → **build chết**.
   - `api/products/` chỉ có `route-api-products.ts` (sai tên) → **không có `route.ts`** → API `/api/products`
     không tồn tại → bộ chọn phần mềm không lấy được danh mục động.
2. **Thiếu `conversations.ts` mới.** File `route-api-chat.ts` gọi `getConversationMemory`, nhưng
   `conversations.ts` trên repo vẫn là bản CŨ (chưa có hàm này) → lỗi:
   `has no exported member named 'getConversationMemory'`.

Ngoài ra `AdminDashboard.tsx` (hyperlink Drive) cũng chưa được áp.

## Khắc phục (chạy trên server) — em đã build thử, ra EXIT=0

### Bước 1 — Sửa tên file route (chạy khối này trong repo)
```bash
cd ~/trungth/hpu-chatbot

cd web/src/app/api/chat
rm -f route.ts route.ts.old          # bỏ route cũ + file backup thừa
mv route-api-chat.ts route.ts        # file MỚI thành route.ts đúng chuẩn

cd ../products
mv route-api-products.ts route.ts    # để /api/products hoạt động

cd ~/trungth/hpu-chatbot
```

### Bước 2 — Chép đè 2 file còn THIẾU (qua SFTP)
| File trong gói | Đích |
|---|---|
| `conversations.ts` | `web/src/lib/db/conversations.ts`  ← **quan trọng, đang thiếu** |
| `AdminDashboard.tsx` | `web/src/app/admin/AdminDashboard.tsx`  ← hyperlink Drive |

### Bước 3 — Migration DB (thêm 2 cột cho memory L2)
```bash
docker compose -f infra/docker-compose.prod.yml exec -T db psql -U hpu -d hpu_chatbot <<'SQL'
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary_upto INT DEFAULT 0;
SQL
```
> Đã gia cố fail-safe: kể cả quên bước này, chat vẫn CHẠY (chỉ là memory L2 tạm nghỉ). Nhưng nên chạy để bật L2.

### Bước 4 — Build lại
```bash
docker compose -f infra/docker-compose.prod.yml up -d --build web
```

## MẸO tránh lỗi tên file lần sau
Quy tắc: mọi file em giao tên `route-api-XXX.ts` → khi đặt vào thư mục `api/XXX/` phải đổi thành `route.ts`.
File `*-page.tsx` → đổi thành `page.tsx`. Còn lại (gemini.ts, prompt.ts, ...) giữ nguyên tên.
