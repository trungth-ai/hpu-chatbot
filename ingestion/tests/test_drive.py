"""Test đệ quy thư mục con + xử lý lối tắt, dùng Drive GIẢ (không gọi mạng)."""
import re
from hpu_ingest import drive


class _Exec:
    def __init__(self, data):
        self._data = data

    def execute(self):
        return self._data


class _Files:
    def __init__(self, tree, metas):
        self.tree = tree      # folder_id -> list[child dict]
        self.metas = metas    # file_id  -> metadata dict

    def list(self, q="", **kw):
        fid = re.search(r"'([^']+)' in parents", q).group(1)
        return _Exec({"files": self.tree.get(fid, []), "nextPageToken": None})

    def get(self, fileId="", **kw):
        return _Exec(self.metas[fileId])


class _Service:
    def __init__(self, files):
        self._files = files

    def files(self):
        return self._files


F = drive.FOLDER
SC = drive.SHORTCUT


def _svc(tree, metas=None):
    return _Service(_Files(tree, metas or {}))


def test_de_quy_nhieu_tang_thu_muc_con():
    tree = {
        "F0": [
            {"id": "A", "name": "a.pdf", "mimeType": "application/pdf"},
            {"id": "F1", "name": "con", "mimeType": F},
        ],
        "F1": [
            {"id": "B", "name": "b.docx", "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
            {"id": "F1a", "name": "cháu", "mimeType": F},
        ],
        "F1a": [
            {"id": "C", "name": "c.pdf", "mimeType": "application/pdf"},  # sâu 2 tầng
        ],
    }
    ids = {f["id"] for f in drive.list_files_recursive(_svc(tree), "F0")}
    assert ids == {"A", "B", "C"}


def test_loi_tat_thu_muc_va_file():
    tree = {
        "F0": [
            {"id": "SC1", "name": "tắt-thư-mục", "mimeType": SC,
             "shortcutDetails": {"targetId": "F2", "targetMimeType": F}},
            {"id": "SC2", "name": "tắt-file", "mimeType": SC,
             "shortcutDetails": {"targetId": "D", "targetMimeType": "application/pdf"}},
        ],
        "F2": [
            {"id": "E", "name": "e.pdf", "mimeType": "application/pdf"},
        ],
    }
    metas = {"D": {"id": "D", "name": "d-thật.pdf", "mimeType": "application/pdf", "md5Checksum": "x"}}
    ids = {f["id"] for f in drive.list_files_recursive(_svc(tree, metas), "F0")}
    assert ids == {"E", "D"}  # E lấy được nhờ vào thư mục đích của lối tắt; D là file đích


def test_chong_lap_vo_han():
    # SC trong F0 trỏ về chính F0 -> không được lặp vô hạn
    tree = {
        "F0": [
            {"id": "A", "name": "a.pdf", "mimeType": "application/pdf"},
            {"id": "LOOP", "name": "vòng", "mimeType": SC,
             "shortcutDetails": {"targetId": "F0", "targetMimeType": F}},
        ],
    }
    ids = {f["id"] for f in drive.list_files_recursive(_svc(tree), "F0")}
    assert ids == {"A"}  # chạy xong, không treo
