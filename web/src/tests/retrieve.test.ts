import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB + Gemini để test logic truy hồi mà không cần DB/API thật
const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({
  pool: { query: (...args: unknown[]) => queryMock(...args) },
}));
vi.mock("@/lib/rag/gemini", () => ({
  embedQuery: vi.fn(async () => [0.1, 0.2, 0.3]),
}));

import { retrieve } from "@/lib/rag/retrieve";

describe("retrieve() — truy hồi pgvector (Sprint 4)", () => {
  beforeEach(() => queryMock.mockReset());

  it("dựng SQL với đúng tham số (vector, product, role, topK) và map kết quả", async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          content: "Bước 1...",
          source_file: "a.pdf",
          source_url: null,
          page: 1,
          section: "Nhập điểm",
          image_url: null,
          score: "0.83", // DB trả về dạng chuỗi
        },
      ],
    });

    const out = await retrieve({ query: "q", product: "pmt-ems", role: "sinh-vien", topK: 6 });

    expect(queryMock).toHaveBeenCalledTimes(1);
    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("FROM kb_documents");
    expect(sql).toContain("role_scope && ARRAY");
    expect(params[0]).toBe("[0.1,0.2,0.3]"); // vector literal
    expect(params[1]).toBe("pmt-ems");
    expect(params[2]).toBe("sinh-vien");
    expect(params[3]).toBe(6);

    expect(out).toHaveLength(1);
    expect(out[0].score).toBe(0.83); // đã ép Number()
    expect(out[0].source_file).toBe("a.pdf");
  });

  it("product = null -> truyền null (tìm trên mọi phần mềm)", async () => {
    queryMock.mockResolvedValue({ rows: [] });
    await retrieve({ query: "q", product: null, role: "cbgv", topK: 6 });
    const params = queryMock.mock.calls[0][1] as unknown[];
    expect(params[1]).toBeNull();
  });

  it("admin -> SQL có nhánh bỏ qua lọc vai trò", async () => {
    queryMock.mockResolvedValue({ rows: [] });
    await retrieve({ query: "q", role: "admin", topK: 6 });
    const sql = queryMock.mock.calls[0][0] as string;
    expect(sql).toContain("$3 = 'admin'");
  });
});
