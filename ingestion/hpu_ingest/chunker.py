"""Cắt tài liệu thành chunk theo cấu trúc nghiệp vụ. Hàm thuần -> dễ test."""
from dataclasses import dataclass
from typing import Iterable, List, Optional, Tuple


@dataclass
class Chunk:
    section: Optional[str]
    content: str


def estimate_tokens(text: str) -> int:
    """Ước lượng số token (xấp xỉ 4 ký tự/token)."""
    return max(1, len(text) // 4)


def split_paragraphs(text: str) -> List[str]:
    """Tách văn bản thành các đoạn theo dòng trống, loại đoạn rỗng."""
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    paras = [p.strip() for p in normalized.split("\n\n")]
    return [p for p in paras if p]


def _hard_split(paragraph: str, size: int) -> List[str]:
    """Cắt cứng một đoạn quá dài thành các mảnh <= size (không tự gối đầu;
    phần gối đầu do bước hậu xử lý chung đảm nhiệm để tránh gối đầu 2 lần)."""
    step = max(1, size)
    return [paragraph[i : i + size] for i in range(0, len(paragraph), step)]


def chunk_paragraphs(
    paragraphs: Iterable[str],
    target_chars: int = 1600,
    overlap_chars: int = 240,
) -> List[str]:
    """Gom các đoạn thành chunk ~target_chars, rồi thêm phần gối đầu giữa các chunk."""
    paragraphs = list(paragraphs)
    packed: List[str] = []
    cur = ""

    for p in paragraphs:
        if len(p) > target_chars:
            if cur:
                packed.append(cur)
                cur = ""
            packed.extend(_hard_split(p, target_chars))
            continue
        if not cur:
            cur = p
        elif len(cur) + 2 + len(p) <= target_chars:
            cur = cur + "\n\n" + p
        else:
            packed.append(cur)
            cur = p
    if cur:
        packed.append(cur)

    if overlap_chars <= 0 or len(packed) <= 1:
        return packed

    # Thêm gối đầu: chunk sau mang theo phần đuôi của chunk trước
    result: List[str] = [packed[0]]
    for i in range(1, len(packed)):
        tail = packed[i - 1][-overlap_chars:]
        result.append((tail + "\n\n" + packed[i]).strip())
    return result


def chunk_sections(
    sections: Iterable[Tuple[Optional[str], str]],
    target_chars: int = 1600,
    overlap_chars: int = 240,
) -> List[Chunk]:
    """Cắt theo từng mục (giữ tiêu đề mục cho mỗi chunk)."""
    out: List[Chunk] = []
    for title, text in sections:
        for content in chunk_paragraphs(split_paragraphs(text), target_chars, overlap_chars):
            if content.strip():
                out.append(Chunk(section=title, content=content))
    return out
