// Lắp prompt cho RAG + xử lý trích dẫn/fallback. Các hàm THUẦN -> dễ test.
import type { Citation } from "@/lib/chat/stream";

export interface RetrievedChunk {
  content: string;
  source_file: string | null;
  section: string | null;
  page: number | null;
  source_url: string | null;
  image_url: string | null;
  score: number;
}

// Câu trả lời khi không tìm thấy trong tài liệu (giọng dễ thương, hướng về CNTT).
export const FALLBACK_MESSAGE =
  "Hmm, chỗ này em lục tài liệu mà chưa thấy hướng dẫn cụ thể 🤔. " +
  "Anh/chị liên hệ Phòng QTM (gặp anh Phóng – 0399 803 785) giúp em nhé, các thầy/cô sẽ hỗ trợ trực tiếp ạ. " +
  "Hoặc anh/chị thử hỏi lại theo cách khác xem em có tìm được không 🙏";

const ROLE_LABEL: Record<string, string> = {
  cbgv: "giảng viên",
  "sinh-vien": "sinh viên",
  "phong-dao-tao": "cán bộ Phòng Đào tạo",
  admin: "quản trị viên",
};

export function roleLabel(role?: string): string {
  return ROLE_LABEL[role ?? ""] ?? "người dùng";
}

/** Chỉ thị hệ thống: tính cách + quy tắc chống bịa + trích dẫn. */
export function buildSystemPrompt(opts: {
  role?: string;
  product?: string | null;
  channel?: string;
  memory?: string | null;
}): string {
  const role = roleLabel(opts.role);
  const product = opts.product ? `phần mềm ${opts.product}` : "các phần mềm của trường";
  const lines: string[] = [
    `Bạn là "Trợ lý HPU" — trợ lý ảo hướng dẫn ${role} của Trường ĐH Quản lý và Công nghệ Hải Phòng (HPU) sử dụng ${product}.`,
    "",
    "# TÍNH CÁCH (nghiêm túc nhưng vui vẻ, thân thiện, hiện đại)",
    '- Giọng NHẸ NHÀNG, GẦN GŨI, hơi HÀI HƯỚC một chút, "chill"; kiên nhẫn, không làm người hỏi thấy ngại.',
    '- Xưng "em", gọi người dùng là "anh/chị". Được dùng 1 emoji phù hợp + 1 câu đùa nhẹ, nhưng không lố.',
    "",
    "# QUY TẮC NỘI DUNG (BẮT BUỘC — ưu tiên hơn tính cách)",
    "1. CHỈ trả lời dựa trên [NGỮ CẢNH] bên dưới. TUYỆT ĐỐI không bịa thao tác, tên nút, menu, đường dẫn không có trong ngữ cảnh.",
    "2. Nếu ngữ cảnh không đủ thông tin, hãy nói thật là chưa tìm thấy và hướng người dùng liên hệ Phòng QTM (gặp anh Phóng – 0399 803 785).",
    "3. Hướng dẫn thao tác trình bày theo CÁC BƯỚC đánh số, ngắn gọn, đúng thuật ngữ phần mềm.",
    "4. KHÔNG trả lời về dữ liệu cá nhân (điểm, hồ sơ của một sinh viên cụ thể). Chỉ hướng dẫn CÁCH LÀM; nếu được hỏi dữ liệu của người khác, từ chối nhẹ nhàng và chỉ cách tự tra trong phần mềm.",
    "5. Nếu câu hỏi nằm NGOÀI phạm vi phần mềm của trường (chính trị, chuyện riêng, chủ đề nhạy cảm...), lịch sự từ chối và kéo về đúng việc hỗ trợ phần mềm.",
    "6. KHÔNG dùng cú pháp LaTeX hay công thức toán (lệnh bắt đầu bằng dấu gạch chéo ngược, hoặc đặt trong dấu $...$). Cần mũi tên thì gõ ký tự → trực tiếp, cần ký hiệu thì viết bằng chữ.",
    "7. Trả lời bằng tiếng Việt.",
  ];
  const mem = (opts.memory ?? "").trim();
  const memBlock =
    mem && mem.toUpperCase() !== "KHÔNG"
      ? "\n\n# GHI NHỚ VỀ NGƯỜI DÙNG & BỐI CẢNH (từ các tin trước trong cuộc trò chuyện)\n" +
        mem +
        "\n- Dùng thông tin này để trả lời nhất quán; KHÔNG hỏi lại điều người dùng đã nói."
      : "";
  const base = lines.join("\n") + memBlock;
  if (opts.product === "tuyen-sinh") {
    return (
      base +
      "\n\n" +
      [
        "# TUYỂN SINH",
        "- Bạn có công cụ lookup_admission_info để tra điểm chuẩn/chỉ tiêu/học phí theo ngành & năm — hãy gọi khi người dùng hỏi số liệu cụ thể.",
        "- Số liệu tra cứu đang ở giai đoạn thử nghiệm; nhắc người dùng xác nhận con số chính thức với Phòng Tuyển sinh.",
      ].join("\n")
    );
  }
  return base;
}

/** Khối ngữ cảnh ghép từ các chunk truy hồi được. */
export function buildContextBlock(chunks: RetrievedChunk[]): string {
  if (!chunks.length) return "[NGỮ CẢNH]\n(Không có tài liệu phù hợp.)";
  const parts = chunks.map((c, i) => {
    const tag = [c.source_file, c.section, c.page ? `tr.${c.page}` : null]
      .filter(Boolean)
      .join(" – ");
    return `[${i + 1}] (${tag})\n${c.content}`;
  });
  return "[NGỮ CẢNH]\n" + parts.join("\n\n---\n\n");
}

/** Prompt người dùng = ngữ cảnh + câu hỏi. */
export function buildUserPrompt(question: string, chunks: RetrievedChunk[]): string {
  return `${buildContextBlock(chunks)}\n\n[CÂU HỎI]\n${question}`;
}

/** Gộp trích dẫn, loại trùng theo (tài liệu + mục + trang). */
export function toCitations(chunks: RetrievedChunk[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const c of chunks) {
    if (!c.source_file) continue;
    const key = `${c.source_file}|${c.section ?? ""}|${c.page ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      source_file: c.source_file,
      section: c.section ?? undefined,
      page: c.page ?? undefined,
      source_url: c.source_url ?? undefined,
      image_url: c.image_url ?? undefined,
    });
  }
  return out;
}

/** Có nên trả lời fallback không (không có chunk hoặc điểm cao nhất < ngưỡng). */
export function shouldFallback(chunks: RetrievedChunk[], threshold: number): boolean {
  if (!chunks.length) return true;
  return chunks[0].score < threshold;
}


// ---- Bộ nhớ hội thoại (Lớp 1: lịch sử ngắn hạn) ----
export interface StoredMsgLite {
  role: string; // "user" | "assistant"
  content: string;
}
export interface HistoryTurn {
  role: "user" | "model";
  text: string;
}

/**
 * Chuyển lịch sử tin nhắn đã lưu (thứ tự thời gian tăng dần, KHÔNG gồm câu hỏi hiện tại)
 * thành các lượt hội thoại cho model. Giữ các lượt GẦN NHẤT trong ngân sách ký tự,
 * và đảm bảo bắt đầu bằng lượt "user" (yêu cầu của Gemini).
 */
export function buildHistoryTurns(messages: StoredMsgLite[], maxChars = 8000): HistoryTurn[] {
  const turns: HistoryTurn[] = [];
  let total = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const text = (messages[i].content ?? "").trim();
    if (!text) continue;
    if (total + text.length > maxChars && turns.length) break; // vượt ngân sách -> dừng (luôn giữ ít nhất 1 lượt)
    turns.push({ role: messages[i].role === "assistant" ? "model" : "user", text });
    total += text.length;
  }
  turns.reverse();
  while (turns.length && turns[0].role !== "user") turns.shift();
  return turns;
}


/** Ghép các tin nhắn (thứ tự tăng dần) thành bản ghi hội thoại để tóm tắt (giữ phần GẦN NHẤT trong ngân sách). */
export function buildTranscript(messages: StoredMsgLite[], maxChars = 12000): string {
  const lines: string[] = [];
  let total = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const who = messages[i].role === "assistant" ? "Trợ lý" : "Người dùng";
    const text = (messages[i].content ?? "").trim();
    if (!text) continue;
    const line = `${who}: ${text}`;
    if (total + line.length > maxChars && lines.length) break;
    lines.push(line);
    total += line.length;
  }
  return lines.reverse().join("\n");
}
