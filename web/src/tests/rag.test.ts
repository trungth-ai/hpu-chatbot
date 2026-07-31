import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  buildContextBlock,
  buildUserPrompt,
  toCitations,
  shouldFallback,
  roleLabel,
  FALLBACK_MESSAGE,
  type RetrievedChunk,
} from "@/lib/rag/prompt";

function chunk(over: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    content: "Bước 1: vào Đào tạo. Bước 2: bấm Lưu.",
    source_file: "HDSD PMT-EMS.pdf",
    section: "Nhập điểm",
    page: 12,
    source_url: "https://drive.google.com/file/d/abc/view",
    image_url: null,
    score: 0.8,
    ...over,
  };
}

describe("buildSystemPrompt — chỉ thị hệ thống (Sprint 4)", () => {
  it("chứa quy tắc chống bịa", () => {
    const s = buildSystemPrompt({ role: "cbgv", product: "pmt-ems" });
    expect(s).toContain("CHỈ trả lời dựa trên");
    expect(s.toLowerCase()).toContain("không bịa");
  });
  it("nêu đúng nhãn vai trò và phần mềm", () => {
    const s = buildSystemPrompt({ role: "sinh-vien", product: "pmt-ems" });
    expect(s).toContain("sinh viên");
    expect(s).toContain("pmt-ems");
  });
  it("không có product -> nói chung 'các phần mềm của trường'", () => {
    const s = buildSystemPrompt({ role: "cbgv", product: null });
    expect(s).toContain("các phần mềm của trường");
  });
});

describe("roleLabel", () => {
  it("ánh xạ đúng các vai trò", () => {
    expect(roleLabel("cbgv")).toBe("giảng viên");
    expect(roleLabel("sinh-vien")).toBe("sinh viên");
    expect(roleLabel("admin")).toBe("quản trị viên");
    expect(roleLabel("xyz")).toBe("người dùng");
  });
});

describe("buildContextBlock / buildUserPrompt", () => {
  it("ghép ngữ cảnh kèm tên tài liệu + mục + trang", () => {
    const block = buildContextBlock([chunk()]);
    expect(block).toContain("HDSD PMT-EMS.pdf");
    expect(block).toContain("Nhập điểm");
    expect(block).toContain("tr.12");
  });
  it("không có chunk -> báo không có tài liệu", () => {
    expect(buildContextBlock([])).toContain("Không có tài liệu");
  });
  it("user prompt gồm cả ngữ cảnh lẫn câu hỏi", () => {
    const p = buildUserPrompt("Cách nhập điểm?", [chunk()]);
    expect(p).toContain("Cách nhập điểm?");
    expect(p).toContain("HDSD PMT-EMS.pdf");
  });
});

describe("toCitations — gộp trích dẫn", () => {
  it("loại trùng theo tài liệu+mục+trang", () => {
    const cites = toCitations([chunk(), chunk(), chunk({ page: 13 })]);
    expect(cites).toHaveLength(2);
  });
  it("bỏ chunk không có source_file", () => {
    const cites = toCitations([chunk({ source_file: null })]);
    expect(cites).toHaveLength(0);
  });
  it("giữ link và ảnh minh họa", () => {
    const cites = toCitations([chunk({ image_url: "https://x/y.png" })]);
    expect(cites[0].source_url).toContain("drive.google.com");
    expect(cites[0].image_url).toBe("https://x/y.png");
  });
});

describe("shouldFallback — quyết định trả lời 'không biết'", () => {
  it("không có chunk -> fallback", () => {
    expect(shouldFallback([], 0.55)).toBe(true);
  });
  it("điểm cao nhất < ngưỡng -> fallback", () => {
    expect(shouldFallback([chunk({ score: 0.4 })], 0.55)).toBe(true);
  });
  it("điểm cao nhất >= ngưỡng -> KHÔNG fallback", () => {
    expect(shouldFallback([chunk({ score: 0.7 })], 0.55)).toBe(false);
  });
  it("câu fallback có nhắc Phòng CNTT", () => {
    expect(FALLBACK_MESSAGE).toContain("CNTT");
  });
});
