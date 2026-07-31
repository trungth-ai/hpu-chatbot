"""Trích văn bản từ PDF / DOCX / text, trả về danh sách (tiêu_đề_mục, nội_dung).

DOCX: đọc CẢ đoạn văn LẪN bảng, theo đúng thứ tự xuất hiện trong tài liệu.
(Nhiều tài liệu quy trình HPU để các bước thao tác trong bảng — nếu bỏ qua bảng
thì kho tri thức chỉ có phần mở đầu, chatbot sẽ báo "chưa có bước chi tiết".)
"""
import io
from typing import List, Optional, Tuple

import pdfplumber
from docx import Document
from docx.document import Document as _DocxDocument
from docx.table import Table, _Cell
from docx.text.paragraph import Paragraph
from docx.oxml.ns import qn

Section = Tuple[Optional[str], str]


def parse_pdf(data: bytes) -> List[Section]:
    sections: List[Section] = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            if text.strip():
                sections.append((f"Trang {i}", text))
    return sections


def _iter_block_items(parent):
    """Duyệt Paragraph và Table theo ĐÚNG THỨ TỰ trong tài liệu (paragraphs + tables)."""
    if isinstance(parent, _DocxDocument):
        parent_elm = parent.element.body
    elif isinstance(parent, _Cell):
        parent_elm = parent._tc
    else:
        parent_elm = parent
    for child in parent_elm.iterchildren():
        if child.tag == qn("w:p"):
            yield Paragraph(child, parent)
        elif child.tag == qn("w:tbl"):
            yield Table(child, parent)


def _table_to_text(table: Table) -> str:
    """Biến bảng thành text: mỗi hàng một dòng, các ô nối bằng ' | '."""
    lines: List[str] = []
    for row in table.rows:
        try:
            cells = [c.text.strip().replace("\n", " ") for c in row.cells]
        except Exception:
            continue
        line = " | ".join(cells).strip()
        if line.strip(" |"):
            lines.append(line)
    return "\n".join(lines)


def parse_docx(data: bytes) -> List[Section]:
    doc = Document(io.BytesIO(data))
    sections: List[Section] = []
    cur_title: Optional[str] = "Mở đầu"
    cur_lines: List[str] = []
    for block in _iter_block_items(doc):
        if isinstance(block, Paragraph):
            style = (block.style.name or "").lower() if block.style else ""
            text = block.text.strip()
            if style.startswith("heading") and text:
                if cur_lines:
                    sections.append((cur_title, "\n\n".join(cur_lines)))
                    cur_lines = []
                cur_title = text
            elif text:
                cur_lines.append(text)
        else:  # Table -> đưa nội dung bảng vào mục hiện tại
            ttext = _table_to_text(block)
            if ttext:
                cur_lines.append(ttext)
    if cur_lines:
        sections.append((cur_title, "\n\n".join(cur_lines)))
    return sections


def parse_text(data: bytes) -> List[Section]:
    text = data.decode("utf-8", errors="replace")
    return [(None, text)] if text.strip() else []
