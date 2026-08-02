"""Test cơ chế thử lại của embed_text bằng mock (không gọi mạng thật)."""
import io
import json
import urllib.error
import pytest
from hpu_ingest import embed


class _Resp(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *a):
        self.close()


def _ok_body():
    return json.dumps({"embedding": {"values": [0.1, 0.2, 0.3]}}).encode()


def test_thu_lai_khi_429_roi_thanh_cong(monkeypatch):
    calls = {"n": 0}

    def fake_urlopen(req, timeout=0):
        calls["n"] += 1
        if calls["n"] < 3:  # 2 lần đầu bị 429
            raise urllib.error.HTTPError(req.full_url, 429, "Too Many Requests", {}, None)
        return _Resp(_ok_body())  # lần 3 thành công

    monkeypatch.setattr(embed.time, "sleep", lambda s: None)  # bỏ chờ cho test nhanh
    monkeypatch.setattr(embed.urllib.request, "urlopen", fake_urlopen)
    monkeypatch.setenv("GEMINI_API_KEY", "x")

    vec = embed.embed_text("xin chào", dim=3)
    assert vec == [0.1, 0.2, 0.3]
    assert calls["n"] == 3  # đã thử lại đúng 3 lần


def test_loi_400_khong_thu_lai(monkeypatch):
    calls = {"n": 0}

    def fake_urlopen(req, timeout=0):
        calls["n"] += 1
        raise urllib.error.HTTPError(req.full_url, 400, "Bad Request", {}, None)

    monkeypatch.setattr(embed.time, "sleep", lambda s: None)
    monkeypatch.setattr(embed.urllib.request, "urlopen", fake_urlopen)
    monkeypatch.setenv("GEMINI_API_KEY", "x")

    with pytest.raises(urllib.error.HTTPError):
        embed.embed_text("x", dim=3)
    assert calls["n"] == 1  # 400 là lỗi request -> KHÔNG thử lại
