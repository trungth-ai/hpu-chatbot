// Sàng lọc câu hỏi TRƯỚC khi gọi RAG: chặn cố ý bẻ prompt và dò dữ liệu cá nhân
// của người khác. Hàm THUẦN -> dễ test. Lưu ý: cố gắng KHÔNG chặn nhầm câu hợp lệ
// (vd "đổi mật khẩu", "xem điểm của tôi"); các trường hợp tinh tế để system prompt lo.

export type ScreenResult =
  | { action: "allow" }
  | { action: "block"; reason: "injection" | "pii"; reply: string };

const INJECTION_PATTERNS: RegExp[] = [
  /\b(bỏ qua|phớt lờ|quên)\s+(hết\s+|mọi\s+|các\s+|toàn bộ\s+)*(hướng dẫn|chỉ thị|quy tắc|nguyên tắc|system prompt)/i,
  /ignore\s+(all\s+|the\s+|any\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /\b(jailbreak|DAN\s*mode|developer\s*mode|chế độ nhà phát triển)\b/i,
  /(đóng vai|giả vờ là|act as)\b[^.?!]*\b(không bị giới hạn|no restrictions?|unfiltered|không kiểm duyệt)/i,
  /(tiết lộ|cho.*xem|in ra)\s+(system\s*prompt|prompt hệ thống|chỉ thị hệ thống)/i,
];

const PII_TRIGGERS = [
  "điểm của",
  "kết quả học tập của",
  "kết quả của",
  "hồ sơ của",
  "thông tin cá nhân của",
  "thông tin của",
  "số điện thoại của",
  "số đt của",
  "địa chỉ của",
  "ngày sinh của",
  "số cccd của",
  "căn cước của",
  "mật khẩu của",
];

// Tự bản thân -> KHÔNG phải dò PII người khác
const SELF = /^\s*(tôi|mình|em|cá nhân tôi|chính tôi|của tôi)\b/i;
// Theo sau là TÊN RIÊNG (>=2 từ viết hoa liên tiếp), có thể đứng sau "sinh viên/bạn/thầy/cô..."
const NAME_AFTER =
  /^\s*(sinh viên\s+|sv\s+|bạn\s+|em\s+|anh\s+|chị\s+|ông\s+|bà\s+|thầy\s+|cô\s+)?[A-ZÀ-Ỹ][a-zà-ỹ]+(\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)+/;
// Hoặc "sinh viên/mssv <có chứa số>"
const ID_AFTER = /^\s*(sinh viên|sv|mã số|mssv)\s+\S*\d/i;

function isInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(text));
}

function isThirdPartyPII(text: string): boolean {
  const lower = text.toLowerCase();
  for (const trig of PII_TRIGGERS) {
    let idx = lower.indexOf(trig);
    while (idx >= 0) {
      const after = text.slice(idx + trig.length);
      if (!SELF.test(after) && (NAME_AFTER.test(after) || ID_AFTER.test(after))) {
        return true;
      }
      idx = lower.indexOf(trig, idx + trig.length);
    }
  }
  return false;
}

export const INJECTION_REPLY =
  "Hì, câu này có vẻ muốn em bỏ qua nguyên tắc làm việc 😅. Em xin phép giữ đúng vai trò trợ lý hướng dẫn phần mềm HPU thôi nha. Anh/chị cần em hỗ trợ gì về phần mềm không ạ?";

export const PII_REPLY =
  "Cái này em xin phép không tra giúp được ạ 🙈 — em không truy cập dữ liệu cá nhân (điểm, hồ sơ…) của người khác để bảo mật thông tin. Em chỉ hướng dẫn *cách dùng* phần mềm thôi. Nếu là dữ liệu của chính anh/chị, em sẽ chỉ cách tự tra trong phần mềm nhé!";

export function screenMessage(text: string): ScreenResult {
  if (isInjection(text)) return { action: "block", reason: "injection", reply: INJECTION_REPLY };
  if (isThirdPartyPII(text)) return { action: "block", reason: "pii", reply: PII_REPLY };
  return { action: "allow" };
}
