// Kiểm thử tải bằng k6.  Chạy: k6 run -e BASE_URL=https://chat.hpu.edu.vn load/k6-chat.js
// Mặc định đánh vào /api/health (không cần đăng nhập) để đo khả năng chịu tải hạ tầng.
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 50 },  // tăng dần tới 50 VUs
    { duration: "1m", target: 100 },  // giữ ~100 VUs
    { duration: "30s", target: 0 },   // hạ tải
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],    // < 1% request lỗi (mục tiêu 5xx = 0)
    http_req_duration: ["p(95)<800"],  // p95 < 800ms
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const res = http.get(`${BASE}/api/health`);
  check(res, {
    "status 200": (r) => r.status === 200,
    "db ok": (r) => {
      try {
        return JSON.parse(r.body).db === "ok";
      } catch {
        return false;
      }
    },
  });
  sleep(1);
}

// Gợi ý đo /api/chat (cần cookie phiên đăng nhập):
//   const headers = { "Content-Type": "application/json", Cookie: __ENV.SESSION_COOKIE };
//   http.post(`${BASE}/api/chat`, JSON.stringify({ message: "cách nhập điểm" }), { headers });
