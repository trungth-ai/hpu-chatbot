#!/bin/sh
# Sao lưu DB định kỳ bằng pg_dump (nén gzip) + xóa bản cũ.
set -eu
INTERVAL="${BACKUP_INTERVAL_SECONDS:-86400}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
mkdir -p /backups
echo "[backup] khởi động — mỗi ${INTERVAL}s, giữ ${KEEP_DAYS} ngày"
while true; do
  TS=$(date +%Y%m%d_%H%M)
  FILE="/backups/hpu_${TS}.sql.gz"
  echo "[backup] ${TS} pg_dump..."
  if pg_dump "${DATABASE_URL}" | gzip > "${FILE}"; then
    echo "[backup] xong: ${FILE} ($(du -h "${FILE}" | cut -f1))"
  else
    echo "[backup] LỖI pg_dump" >&2
    rm -f "${FILE}"
  fi
  find /backups -name 'hpu_*.sql.gz' -mtime +"${KEEP_DAYS}" -delete 2>/dev/null || true
  sleep "${INTERVAL}"
done
