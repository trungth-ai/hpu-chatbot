#!/usr/bin/env python3
"""Đồng bộ tài liệu từ Google Drive vào kho tri thức (pgvector).

CLI:
    python sync.py --all              # đồng bộ tất cả nguồn đang bật
    python sync.py --source <id>      # chỉ đồng bộ 1 nguồn theo id

Hàm run_sync() cũng được server.py (HTTP trigger) gọi lại.
Đồng bộ INCREMENTAL: file không đổi (md5/modifiedTime) sẽ được bỏ qua.
"""
import argparse
import sys
from typing import Any, Dict, Optional

from hpu_ingest import db as dbm
from hpu_ingest import drive as drv
from hpu_ingest import embed as emb
from hpu_ingest import parse as prs
from hpu_ingest.chunker import chunk_sections
from hpu_ingest.config import settings

IMAGE_MIMES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
PDF = "application/pdf"
DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
TEXTLIKE = {"text/plain", "text/markdown"}
GOOGLE_DOC = drv.GOOGLE_DOC


def _extract_sections(service, f: Dict[str, Any]):
    """Trả về (sections, image_url) tùy loại file."""
    mime, fid, name = f["mimeType"], f["id"], f["name"]
    if mime == PDF:
        return prs.parse_pdf(drv.download_file(service, fid)), None
    if mime == DOCX:
        return prs.parse_docx(drv.download_file(service, fid)), None
    if mime == GOOGLE_DOC:
        return prs.parse_text(drv.export_google_doc(service, fid)), None
    if mime in TEXTLIKE:
        return prs.parse_text(drv.download_file(service, fid)), None
    if mime in IMAGE_MIMES:
        data = drv.download_file(service, fid)
        caption = emb.caption_image(data, mime, settings.gemini_model)
        url = f"https://drive.google.com/file/d/{fid}/view"
        return ([(name, caption)] if caption else []), url
    return None, None  # MIME chưa hỗ trợ


def process_file(conn, service, source: Dict[str, Any], f: Dict[str, Any]) -> int:
    marker = f.get("md5Checksum") or f.get("modifiedTime")
    f["marker"] = marker

    if dbm.get_existing_marker(conn, f["id"]) == marker:
        return 0  # không đổi -> bỏ qua (incremental)

    dbm.delete_file_chunks(conn, f["id"])  # mới/đổi -> xóa chunk cũ

    sections, image_url = _extract_sections(service, f)
    if sections is None:
        print(f"   - Bỏ qua (chưa hỗ trợ MIME {f['mimeType']}): {f['name']}")
        dbm.upsert_drive_file(conn, source["id"], f)
        conn.commit()
        return 0

    chunks = chunk_sections(
        sections, target_chars=settings.target_chars, overlap_chars=settings.overlap_chars
    )
    added = 0
    for ch in chunks:
        vec = emb.embed_text(ch.content, settings.embedding_model)
        dbm.insert_chunk(
            conn,
            source=source,
            drive_file_id=f["id"],
            name=f["name"],
            section=ch.section,
            content=ch.content,
            image_url=image_url,
            embedding=vec,
        )
        added += 1
    dbm.upsert_drive_file(conn, source["id"], f)
    conn.commit()
    return added


def run_sync(source_id: Optional[int] = None) -> Dict[str, Any]:
    """Chạy đồng bộ. Trả về tóm tắt {sources, chunks}. Dùng cho cả CLI lẫn HTTP."""
    emb.configure()
    service = drv.get_drive_service(settings.sa_key_base64)
    conn = dbm.connect(settings.database_url)
    try:
        sources = dbm.get_enabled_sources(conn)
        if source_id:
            sources = [s for s in sources if s["id"] == source_id]
        if not sources:
            return {"sources": 0, "chunks": 0, "message": "Không có nguồn để đồng bộ"}

        total = 0
        for s in sources:
            print(f"== Nguồn #{s['id']} | product={s['product']} | folder={s['folder_id']}")
            files = drv.list_files_recursive(service, s["folder_id"])
            print(f"   Tìm thấy {len(files)} file")
            for f in files:
                try:
                    added = process_file(conn, service, s, f)
                    if added:
                        print(f"   + {f['name']}: {added} chunk")
                        total += added
                except Exception as e:  # 1 file lỗi không làm hỏng cả mẻ
                    conn.rollback()
                    print(f"   ! Lỗi xử lý {f.get('name')}: {e}", file=sys.stderr)
            dbm.update_source_synced(conn, s["id"])
            conn.commit()
        return {"sources": len(sources), "chunks": total}
    finally:
        conn.close()


def main() -> int:
    ap = argparse.ArgumentParser(description="Đồng bộ tài liệu Drive -> pgvector")
    ap.add_argument("--source", type=int, help="Chỉ đồng bộ 1 nguồn theo id")
    ap.add_argument("--all", action="store_true", help="Đồng bộ tất cả nguồn đang bật")
    args = ap.parse_args()
    if not args.all and not args.source:
        ap.error("Cần --all hoặc --source <id>")
    result = run_sync(args.source)
    print(f"Hoàn tất: {result}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
