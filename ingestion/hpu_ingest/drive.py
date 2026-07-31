"""Kết nối Google Drive bằng Service Account (chỉ đọc)."""
import base64
import io
import json
from typing import List, Dict, Any

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
GOOGLE_DOC = "application/vnd.google-apps.document"
FOLDER = "application/vnd.google-apps.folder"


def get_drive_service(sa_key_base64: str):
    if not sa_key_base64:
        raise RuntimeError("Thiếu GOOGLE_SA_KEY_BASE64 (key Service Account dạng base64).")
    info = json.loads(base64.b64decode(sa_key_base64))
    creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def list_files_recursive(service, folder_id: str) -> List[Dict[str, Any]]:
    """Liệt kê đệ quy mọi file (không phải thư mục) trong folder."""
    files: List[Dict[str, Any]] = []
    stack = [folder_id]
    while stack:
        fid = stack.pop()
        page_token = None
        while True:
            resp = (
                service.files()
                .list(
                    q=f"'{fid}' in parents and trashed=false",
                    fields="nextPageToken, files(id,name,mimeType,md5Checksum,modifiedTime)",
                    pageToken=page_token,
                    pageSize=100,
                    supportsAllDrives=True,
                    includeItemsFromAllDrives=True,
                )
                .execute()
            )
            for f in resp.get("files", []):
                if f["mimeType"] == FOLDER:
                    stack.append(f["id"])
                else:
                    files.append(f)
            page_token = resp.get("nextPageToken")
            if not page_token:
                break
    return files


def _download(request) -> bytes:
    buf = io.BytesIO()
    downloader = MediaIoBaseDownload(buf, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    return buf.getvalue()


def download_file(service, file_id: str) -> bytes:
    return _download(service.files().get_media(fileId=file_id, supportsAllDrives=True))


def export_google_doc(service, file_id: str, mime: str = "text/plain") -> bytes:
    return _download(service.files().export_media(fileId=file_id, mimeType=mime))
