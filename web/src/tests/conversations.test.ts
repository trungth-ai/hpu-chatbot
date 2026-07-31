import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({
  pool: { query: (...args: unknown[]) => queryMock(...args) },
}));

import {
  createConversation,
  listConversations,
  conversationOwned,
  getMessages,
  saveMessage,
  setTitleIfEmpty,
  deleteConversation,
  messageOwned,
  saveFeedback,
} from "@/lib/db/conversations";

function lastCall() {
  return queryMock.mock.calls[queryMock.mock.calls.length - 1] as [string, unknown[]];
}

describe("Truy vấn lịch sử — Sprint 5 (mock DB)", () => {
  beforeEach(() => queryMock.mockReset());

  it("createConversation: INSERT trả về id", async () => {
    queryMock.mockResolvedValue({ rows: [{ id: "conv-1" }] });
    const id = await createConversation(42, "Tiêu đề");
    const [sql, params] = lastCall();
    expect(sql).toContain("INSERT INTO conversations");
    expect(params).toEqual([42, "Tiêu đề"]);
    expect(id).toBe("conv-1");
  });

  it("listConversations: LỌC theo user_id, sắp xếp mới nhất", async () => {
    queryMock.mockResolvedValue({
      rows: [{ id: "c1", title: "A", updated_at: "2026-01-01" }],
    });
    const out = await listConversations(7);
    const [sql, params] = lastCall();
    expect(sql).toContain("WHERE user_id = $1");
    expect(sql).toContain("ORDER BY updated_at DESC");
    expect(params).toEqual([7]);
    expect(out[0]).toEqual({ id: "c1", title: "A", updatedAt: "2026-01-01" });
  });

  it("conversationOwned: true khi rowCount > 0", async () => {
    queryMock.mockResolvedValue({ rowCount: 1, rows: [{ "?column?": 1 }] });
    expect(await conversationOwned("c1", 7)).toBe(true);
    const [sql, params] = lastCall();
    expect(sql).toContain("WHERE id = $1 AND user_id = $2");
    expect(params).toEqual(["c1", 7]);
  });

  it("conversationOwned: false khi rowCount = 0", async () => {
    queryMock.mockResolvedValue({ rowCount: 0, rows: [] });
    expect(await conversationOwned("c1", 999)).toBe(false);
  });

  it("getMessages: ÉP quyền sở hữu bằng JOIN user_id", async () => {
    queryMock.mockResolvedValue({
      rows: [
        { id: "m1", role: "user", content: "hi", citations: null, created_at: "t1" },
        { id: "m2", role: "assistant", content: "chào", citations: [{ source_file: "a" }], created_at: "t2" },
      ],
    });
    const out = await getMessages("c1", 7);
    const [sql, params] = lastCall();
    expect(sql).toContain("JOIN conversations c ON c.id = m.conversation_id");
    expect(sql).toContain("c.user_id = $2");
    expect(params).toEqual(["c1", 7]);
    expect(out).toHaveLength(2);
    expect(out[1].citations).toEqual([{ source_file: "a" }]);
  });

  it("saveMessage: chuyển citations thành JSON, trả về id", async () => {
    queryMock.mockResolvedValue({ rows: [{ id: "m9" }] });
    const id = await saveMessage("c1", "assistant", "nội dung", [{ source_file: "x.pdf" }], "pmt-ems");
    const [sql, params] = lastCall();
    expect(sql).toContain("INSERT INTO messages");
    expect(params[0]).toBe("c1");
    expect(params[1]).toBe("assistant");
    expect(params[3]).toBe(JSON.stringify([{ source_file: "x.pdf" }])); // JSON hóa
    expect(params[5]).toBe("web"); // channel mặc định
    expect(id).toBe("m9");
  });

  it("saveMessage: citations null -> truyền null", async () => {
    queryMock.mockResolvedValue({ rows: [{ id: "m10" }] });
    await saveMessage("c1", "user", "hỏi", null, null);
    const [, params] = lastCall();
    expect(params[3]).toBeNull();
  });

  it("setTitleIfEmpty: chỉ cập nhật khi tiêu đề trống", async () => {
    queryMock.mockResolvedValue({ rowCount: 1 });
    await setTitleIfEmpty("c1", "Tiêu đề mới");
    const [sql, params] = lastCall();
    expect(sql).toContain("title IS NULL OR title = ''");
    expect(params).toEqual(["c1", "Tiêu đề mới"]);
  });

  it("deleteConversation: chỉ xóa hội thoại của mình, trả bool", async () => {
    queryMock.mockResolvedValue({ rowCount: 1 });
    expect(await deleteConversation("c1", 7)).toBe(true);
    const [sql, params] = lastCall();
    expect(sql).toContain("DELETE FROM conversations WHERE id = $1 AND user_id = $2");
    expect(params).toEqual(["c1", 7]);

    queryMock.mockResolvedValue({ rowCount: 0 });
    expect(await deleteConversation("c1", 8)).toBe(false);
  });

  it("messageOwned: kiểm tra qua JOIN user_id", async () => {
    queryMock.mockResolvedValue({ rowCount: 1 });
    expect(await messageOwned("m1", 7)).toBe(true);
    const [sql, params] = lastCall();
    expect(sql).toContain("JOIN conversations c ON c.id = m.conversation_id");
    expect(sql).toContain("m.id = $1 AND c.user_id = $2");
    expect(params).toEqual(["m1", 7]);
  });

  it("saveFeedback: INSERT đúng tham số", async () => {
    queryMock.mockResolvedValue({ rows: [] });
    await saveFeedback("m1", 7, 1, null);
    const [sql, params] = lastCall();
    expect(sql).toContain("INSERT INTO feedback");
    expect(params).toEqual(["m1", 7, 1, null]);
  });
});
