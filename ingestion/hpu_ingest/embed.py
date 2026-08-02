"""Sinh embedding và chú thích ảnh chụp màn hình bằng Gemini."""
import os
import json
import time
import urllib.request
import urllib.error
import google.generativeai as genai
from typing import List

_CAPTION_PROMPT = (
    "Mô tả ngắn gọn bằng tiếng Việt nội dung ảnh chụp màn hình phần mềm này: "
    "tên màn hình, các menu, nút bấm và trường nhập quan trọng. "
    "Viết như một đoạn hướng dẫn để người khác tìm được chức năng trong phần mềm."
)

# Mã lỗi HTTP nên thử lại: 429 = quá tải/giới hạn tốc độ; 5xx = lỗi tạm thời phía server.
_RETRYABLE = {429, 500, 502, 503, 504}


def configure(api_key: str = "") -> None:
    genai.configure(api_key=api_key or os.environ["GEMINI_API_KEY"])


def embed_text(text: str, model: str = "", dim: int = 0, max_retries: int = 6) -> List[float]:
    """Nhúng 1 đoạn văn. Tự THỬ LẠI với chờ lũy tiến khi gặp 429/5xx/timeout,
    để đồng bộ khối lượng lớn (hàng trăm file) không bị rớt vì giới hạn tốc độ."""
    model = model or os.environ.get("EMBEDDING_MODEL", "gemini-embedding-001")
    dim = dim or int(os.environ.get("EMBEDDING_DIM", "1536"))
    key = os.environ["GEMINI_API_KEY"]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent?key={key}"
    body = json.dumps({
        "model": f"models/{model}",
        "content": {"parts": [{"text": text}]},
        "taskType": "RETRIEVAL_DOCUMENT",
        "outputDimensionality": dim,
    }).encode("utf-8")

    delay = 2.0
    last_err = None
    for attempt in range(max_retries):
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return data["embedding"]["values"]
        except urllib.error.HTTPError as e:
            last_err = e
            if e.code in _RETRYABLE and attempt < max_retries - 1:
                time.sleep(delay)
                delay = min(delay * 2, 60)
                continue
            raise
        except (urllib.error.URLError, TimeoutError) as e:
            last_err = e
            if attempt < max_retries - 1:
                time.sleep(delay)
                delay = min(delay * 2, 60)
                continue
            raise
    raise RuntimeError(f"embed_text thất bại sau {max_retries} lần thử: {last_err}")


def caption_image(data: bytes, mime: str, model: str = "gemini-1.5-pro") -> str:
    m = genai.GenerativeModel(model)
    resp = m.generate_content([{"mime_type": mime, "data": data}, _CAPTION_PROMPT])
    return (resp.text or "").strip()
