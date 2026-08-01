#!/usr/bin/env bash
# Chạy trong thư mục gốc repo: bash fix-ten-file.sh
set -e
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"
echo "Sửa api/chat ..."
( cd web/src/app/api/chat && rm -f route.ts route.ts.old && mv -f route-api-chat.ts route.ts )
echo "Sửa api/products ..."
( cd web/src/app/api/products && mv -f route-api-products.ts route.ts )
echo "Xong. Kiểm tra:"
ls web/src/app/api/chat/ web/src/app/api/products/
