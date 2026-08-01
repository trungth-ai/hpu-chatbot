import { describe, it, expect } from "vitest";
import { buildHistoryTurns } from "@/lib/rag/prompt";
import { mergeProductOptions, prettifySlug } from "@/lib/rag/products";

describe("buildHistoryTurns (bộ nhớ hội thoại)", () => {
  it("map assistant->model, user->user, bắt đầu bằng user", () => {
    const turns = buildHistoryTurns([
      { role: "user", content: "em tên Trung, giảng viên khoa CNTT" },
      { role: "assistant", content: "dạ chào anh Trung ạ" },
      { role: "user", content: "nhắc lại tên em xem" },
    ]);
    expect(turns.map((t) => t.role)).toEqual(["user", "model", "user"]);
    expect(turns[0].text).toContain("Trung");
  });

  it("giữ các lượt GẦN NHẤT theo ngân sách ký tự", () => {
    const msgs = Array.from({ length: 50 }, (_, i) => ({
      role: i % 2 ? "assistant" : "user",
      content: "x".repeat(100),
    }));
    const turns = buildHistoryTurns(msgs, 250);
    const total = turns.reduce((n, t) => n + t.text.length, 0);
    expect(total).toBeLessThanOrEqual(300);
    expect(turns[0].role).toBe("user");
  });

  it("bỏ lượt rỗng", () => {
    const turns = buildHistoryTurns([
      { role: "user", content: "câu đầu của người dùng" },
      { role: "user", content: "  " },
      { role: "user", content: "hỏi thật" },
    ]);
    expect(turns).toHaveLength(2);
    expect(turns.every((t) => t.text.trim().length > 0)).toBe(true);
  });

  it("bỏ lượt model ở ĐẦU (Gemini phải bắt đầu bằng user)", () => {
    const turns = buildHistoryTurns([
      { role: "assistant", content: "bot chào trước" },
      { role: "user", content: "người dùng hỏi" },
    ]);
    expect(turns).toHaveLength(1);
    expect(turns[0].role).toBe("user");
    expect(turns[0].text).toBe("người dùng hỏi");
  });
});

describe("mergeProductOptions (danh mục động)", () => {
  it("gộp danh mục cứng + product mới có nội dung, không trùng", () => {
    const opts = mergeProductOptions(["pmt-ems", "sach-giao-khoa"]);
    const ids = opts.map((o) => o.id);
    expect(ids).toContain("pmt-ems");
    expect(ids).toContain("sach-giao-khoa");
    expect(ids.filter((x) => x === "pmt-ems")).toHaveLength(1);
    expect(opts.find((o) => o.id === "sach-giao-khoa")?.label).toBe("Sach Giao Khoa");
  });
  it("prettifySlug đổi gạch nối thành nhãn", () => {
    expect(prettifySlug("tuyen-sinh-2026")).toBe("Tuyen Sinh 2026");
  });
});

import { buildTranscript, buildSystemPrompt } from "@/lib/rag/prompt";

describe("Lớp 2 bộ nhớ", () => {
  it("buildTranscript ghép đúng vai + giữ phần gần nhất theo ngân sách", () => {
    const t = buildTranscript([
      { role: "user", content: "em là Trung" },
      { role: "assistant", content: "dạ chào anh" },
    ]);
    expect(t).toBe("Người dùng: em là Trung\nTrợ lý: dạ chào anh");
    const many = Array.from({ length: 100 }, () => ({ role: "user", content: "y".repeat(50) }));
    expect(buildTranscript(many, 200).length).toBeLessThanOrEqual(260);
  });

  it("buildSystemPrompt tiêm ghi nhớ khi có, bỏ khi KHÔNG", () => {
    const withMem = buildSystemPrompt({ role: "cbgv", memory: "- Tên: Trung\n- Vai trò: giảng viên" });
    expect(withMem).toContain("GHI NHỚ VỀ NGƯỜI DÙNG");
    expect(withMem).toContain("Trung");
    const noMem = buildSystemPrompt({ role: "cbgv", memory: "KHÔNG" });
    expect(noMem).not.toContain("GHI NHỚ VỀ NGƯỜI DÙNG");
    const empty = buildSystemPrompt({ role: "cbgv" });
    expect(empty).not.toContain("GHI NHỚ VỀ NGƯỜI DÙNG");
  });
});
