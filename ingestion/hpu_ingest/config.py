import os
from dataclasses import dataclass


@dataclass
class Settings:
    sa_key_base64: str
    database_url: str
    embedding_model: str
    gemini_model: str
    target_chars: int
    overlap_chars: int


settings = Settings(
    sa_key_base64=os.environ.get("GOOGLE_SA_KEY_BASE64", ""),
    database_url=os.environ.get("DATABASE_URL", ""),
    embedding_model=os.environ.get("EMBEDDING_MODEL", "text-embedding-004"),
    gemini_model=os.environ.get("GEMINI_MODEL", "gemini-2.0-flash"),
    target_chars=int(os.environ.get("CHUNK_TARGET_CHARS", "1600")),
    overlap_chars=int(os.environ.get("CHUNK_OVERLAP_CHARS", "240")),
)
