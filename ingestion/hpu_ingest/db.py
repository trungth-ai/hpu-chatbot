"""Thao tác PostgreSQL cho worker nạp tài liệu."""
from typing import Any, Dict, List, Optional

import psycopg2
import psycopg2.extras


def connect(database_url: str):
    return psycopg2.connect(database_url)


def get_enabled_sources(conn) -> List[Dict[str, Any]]:
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT * FROM drive_sources WHERE enabled = TRUE ORDER BY id")
        return list(cur.fetchall())


def get_existing_marker(conn, drive_file_id: str) -> Optional[str]:
    with conn.cursor() as cur:
        cur.execute("SELECT md5 FROM drive_files WHERE drive_file_id = %s", (drive_file_id,))
        row = cur.fetchone()
        return row[0] if row else None


def delete_file_chunks(conn, drive_file_id: str) -> None:
    with conn.cursor() as cur:
        cur.execute("DELETE FROM kb_documents WHERE drive_file_id = %s", (drive_file_id,))


def upsert_drive_file(conn, source_id: int, f: Dict[str, Any]) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO drive_files (source_id, drive_file_id, name, mime_type, md5, synced_at)
            VALUES (%s, %s, %s, %s, %s, now())
            ON CONFLICT (drive_file_id) DO UPDATE
              SET name = EXCLUDED.name, mime_type = EXCLUDED.mime_type,
                  md5 = EXCLUDED.md5, synced_at = now()
            """,
            (source_id, f["id"], f["name"], f["mimeType"], f["marker"]),
        )


def insert_chunk(
    conn,
    *,
    source: Dict[str, Any],
    drive_file_id: str,
    name: str,
    section: Optional[str],
    content: str,
    image_url: Optional[str],
    embedding: List[float],
) -> None:
    vec = "[" + ",".join(str(x) for x in embedding) + "]"
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO kb_documents
              (product, module, role_scope, version, drive_file_id,
               source_file, source_url, section, image_url, content, embedding)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::vector)
            """,
            (
                (source["product"] or "").strip().lower(),
                source["module"],
                source["role_scope"],          # psycopg2 tự map list -> text[]
                source["version"],
                drive_file_id,
                name,
                f"https://drive.google.com/file/d/{drive_file_id}/view",
                section,
                image_url,
                content,
                vec,
            ),
        )


def update_source_synced(conn, source_id: int) -> None:
    with conn.cursor() as cur:
        cur.execute("UPDATE drive_sources SET last_synced_at = now() WHERE id = %s", (source_id,))
