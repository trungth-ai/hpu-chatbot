# Bộ hoàn chỉnh: Memory Lớp 1+2 · Danh mục động · Hyperlink Drive (07/2026)

**Bộ này gồm CẢ phần memory Lớp 1 + danh mục động của lần trước.** Nếu lần trước anh
chưa áp dụng thì dùng luôn bộ này là đủ; nếu áp dụng rồi thì các file trùng tên ở đây
**thay thế** bản cũ (đã gộp thêm Lớp 2). Đã verify: typecheck 0 · 138 test · build EXIT=0.

## Chép đè (SFTP) — trong `~/trungth/hpu-chatbot/`

| File | Đích |
|---|---|
| `gemini.ts` | `web/src/lib/rag/gemini.ts` |
| `prompt.ts` | `web/src/lib/rag/prompt.ts` |
| `route-api-chat.ts` | `web/src/app/api/chat/route.ts` |
| `conversations.ts` | `web/src/lib/db/conversations.ts` |
| `AdminDashboard.tsx` | `web/src/app/admin/AdminDashboard.tsx` |
| `products.ts` | `web/src/lib/rag/products.ts` |
| `admin.ts` | `web/src/lib/db/admin.ts` |
| `route-api-products.ts` | `web/src/app/api/products/route.ts` (file MỚI) |
| `ProductSelector.tsx` | `web/src/components/chat/ProductSelector.tsx` |
| `rag.test.ts` | `web/src/tests/rag.test.ts` |
| `memory-products.test.ts` | `web/src/tests/memory-products.test.ts` (file MỚI) |
| `04_history.sql` | `db/init/04_history.sql` (chỉ dùng khi cài mới) |

## Bước 1 — Migration DB (thêm 2 cột cho Lớp 2, an toàn, không mất dữ liệu)
```bash
cd ~/trungth/hpu-chatbot
docker compose -f infra/docker-compose.prod.yml exec -T db psql -U hpu -d hpu_chatbot <<'SQL'
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary_upto INT DEFAULT 0;
SQL
```

## Bước 2 — Build lại web
```bash
docker compose -f infra/docker-compose.prod.yml up -d --build web
```

## Tinh chỉnh (tùy chọn, thêm vào `.env`)
- `HISTORY_MAX_CHARS=8000`  — độ dài lịch sử Lớp 1 đưa vào model.
- `MEMORY_L2=1`             — bật/tắt Lớp 2 (đặt `0` để tắt nếu cần).
- `SUMMARY_AFTER=8`         — hội thoại đạt bao nhiêu tin thì bắt đầu tóm tắt.
- `SUMMARY_EVERY=6`         — cứ thêm bao nhiêu tin thì cập nhật lại ghi nhớ (tiết kiệm gọi Gemini).

## Kiểm thử
1. **Lớp 1** (nhớ trong 1 cuộc): nói "em tên Trung, giảng viên khoa X" → hỏi ngay "em vừa nói tên gì?" → phải đúng.
2. **Lớp 2** (nhớ khi chat DÀI): trò chuyện qua ~8–10 tin, thông tin khai lúc đầu vẫn được nhớ ở các câu sau (kể cả khi đã trôi khỏi cửa sổ Lớp 1). Kiểm tra cột đã lưu:
   `docker compose ... exec -T db psql -U hpu -d hpu_chatbot -c "SELECT left(summary,200) FROM conversations WHERE summary IS NOT NULL ORDER BY updated_at DESC LIMIT 3;"`
3. **Hyperlink**: vào `/admin` → tên phần mềm ở cột đầu giờ bấm được, mở thẳng thư mục Drive.
4. **Collection động**: sau khi sửa được đồng bộ sách giáo khoa → mục mới tự hiện trong ô "Phần mềm".
