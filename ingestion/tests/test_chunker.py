"""Test logic cắt chunk — Sprint 3."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from hpu_ingest.chunker import (  # noqa: E402
    Chunk,
    chunk_paragraphs,
    chunk_sections,
    estimate_tokens,
    split_paragraphs,
)


def test_split_paragraphs_bo_doan_rong():
    text = "Đoạn 1\n\n\n\nĐoạn 2\n\n   \n\nĐoạn 3"
    assert split_paragraphs(text) == ["Đoạn 1", "Đoạn 2", "Đoạn 3"]


def test_van_ban_rong_tra_ve_rong():
    assert chunk_paragraphs([]) == []
    assert chunk_sections([(None, "")]) == []


def test_van_ban_ngan_thanh_1_chunk():
    paras = ["Bước 1: mở phần mềm.", "Bước 2: bấm Lưu."]
    chunks = chunk_paragraphs(paras, target_chars=1000, overlap_chars=100)
    assert len(chunks) == 1
    assert "Bước 1" in chunks[0] and "Bước 2" in chunks[0]


def test_van_ban_dai_thanh_nhieu_chunk():
    paras = [f"Đoạn số {i} " + ("x" * 40) for i in range(20)]
    chunks = chunk_paragraphs(paras, target_chars=100, overlap_chars=20)
    assert len(chunks) > 1
    # không chunk nào vượt quá nhiều so với target (target + overlap + lề)
    for c in chunks:
        assert len(c) <= 100 + 20 + 5


def test_doan_qua_dai_bi_cat_cung():
    big = "y" * 500
    chunks = chunk_paragraphs([big], target_chars=100, overlap_chars=20)
    assert len(chunks) >= 5
    # Mỗi chunk <= target + overlap (do chunk sau mang theo phần gối đầu) + lề
    for c in chunks:
        assert len(c) <= 100 + 20 + 2


def test_co_goi_dau_giua_cac_chunk():
    paras = ["AAAA" * 25, "BBBB" * 25]  # 2 đoạn 100 ký tự
    chunks = chunk_paragraphs(paras, target_chars=100, overlap_chars=20)
    assert len(chunks) == 2
    # chunk sau phải chứa phần đuôi của chunk trước
    tail = chunks[0][-20:]
    assert tail in chunks[1]


def test_chunk_sections_giu_tieu_de_muc():
    sections = [("Nhập điểm", "Hướng dẫn nhập điểm chi tiết."), ("Đăng ký", "Hướng dẫn đăng ký.")]
    out = chunk_sections(sections, target_chars=1000, overlap_chars=50)
    assert all(isinstance(c, Chunk) for c in out)
    titles = {c.section for c in out}
    assert titles == {"Nhập điểm", "Đăng ký"}


def test_estimate_tokens():
    assert estimate_tokens("") == 1
    assert estimate_tokens("x" * 400) == 100
