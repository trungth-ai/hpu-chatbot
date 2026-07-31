"""Sinh embedding và chú thích ảnh chụp màn hình bằng Gemini."""
import os
import json
import urllib.request
import google.generativeai as genai
from typing import List

import google.generativeai as genai

_CAPTION_PROMPT = (
    "Mô tả ngắn gọn bằng tiếng Việt nội dung ảnh chụp màn hình phần mềm này: "
    "tên màn hình, các menu, nút bấm và trường nhập quan trọng. "
    "Viết như một đoạn hướng dẫn để người khác tìm được chức năng trong phần mềm."
)


def configure(api_key: str = "") -> None:
    genai.configure(api_key=api_key or os.environ["GEMINI_API_KEY"])


def embed_text(text: str, model: str = "", dim: int = 0) -> List[float]:
    model = model or os.environ.get("EMBEDDING_MODEL", "gemini-1.5-pro")
    dim = dim or int(os.environ.get("EMBEDDING_DIM", "1536"))
    key = os.environ["GEMINI_API_KEY"]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent?key={key}"
    body = json.dumps({
        "model": f"models/{model}",
        "content": {"parts": [{"text": text}]},
        "taskType": "RETRIEVAL_DOCUMENT",
        "outputDimensionality": dim,
    }).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["embedding"]["values"]


def caption_image(data: bytes, mime: str, model: str = "gemini-1.5-pro") -> str:
    m = genai.GenerativeModel(model)
    resp = m.generate_content([{"mime_type": mime, "data": data}, _CAPTION_PROMPT])
    return (resp.text or "").strip()
