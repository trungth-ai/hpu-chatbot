#!/usr/bin/env python3
"""HTTP trigger tối giản cho worker đồng bộ (chỉ dùng thư viện chuẩn).

Endpoints:
    GET  /health  -> {"status":"ok","running":bool}
    POST /sync    -> bắt đầu đồng bộ trong nền; body tùy chọn {"source_id": <id>}
                     202 nếu bắt đầu, 409 nếu đang chạy.

Web (Next.js) gọi qua INGEST_URL (mặc định http://ingest:8787).
"""
import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from sync import run_sync

_lock = threading.Lock()
_state = {"running": False, "last_result": None}


def _background(source_id):
    try:
        _state["last_result"] = run_sync(source_id)
    except Exception as e:  # ghi lỗi để xem qua /health
        _state["last_result"] = {"error": str(e)}
    finally:
        _state["running"] = False


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self._send(200, {"status": "ok", "running": _state["running"], "last_result": _state["last_result"]})
        else:
            self._send(404, {"error": "not_found"})

    def do_POST(self):
        if self.path != "/sync":
            self._send(404, {"error": "not_found"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        source_id = None
        if length:
            try:
                source_id = json.loads(self.rfile.read(length)).get("source_id")
            except Exception:
                source_id = None
        with _lock:
            if _state["running"]:
                self._send(409, {"error": "already_running"})
                return
            _state["running"] = True
        threading.Thread(target=_background, args=(source_id,), daemon=True).start()
        self._send(202, {"status": "started"})

    def log_message(self, *args):  # tắt log mặc định
        return


if __name__ == "__main__":
    print("Worker đồng bộ HTTP trigger lắng nghe tại :8787")
    HTTPServer(("0.0.0.0", 8787), Handler).serve_forever()
