import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ pool: { query: (...a: unknown[]) => queryMock(...a) } }));

import {
  listDriveSources,
  createDriveSource,
  setDriveSourceEnabled,
  deleteDriveSource,
  listUsers,
  updateUserRole,
  getOverview,
  usageByProduct,
  recentGaps,
} from "@/lib/db/admin";

function lastCall() {
  return queryMock.mock.calls[queryMock.mock.calls.length - 1] as [string, unknown[]];
}

describe("Truy vấn quản trị — Sprint 6 (mock DB)", () => {
  beforeEach(() => queryMock.mockReset());

  it("listDriveSources: ép kiểu số cho file_count/chunk_count", async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          id: 1, folder_id: "F", product: "pmt-ems", module: "dt",
          role_scope: ["all"], version: "v1", enabled: true,
          last_synced_at: "t", file_count: "3", chunk_count: "12",
        },
      ],
    });
    const out = await listDriveSources();
    expect(out[0].fileCount).toBe(3);
    expect(out[0].chunkCount).toBe(12);
    expect(out[0].roleScope).toEqual(["all"]);
  });

  it("createDriveSource: truyền role_scope dạng mảng, trả id", async () => {
    queryMock.mockResolvedValue({ rows: [{ id: 9 }] });
    const id = await createDriveSource({
      folderId: "F", product: "pmt-ems", module: null, roleScope: ["cbgv", "all"], version: null,
    });
    const [sql, params] = lastCall();
    expect(sql).toContain("INSERT INTO drive_sources");
    expect(params[0]).toBe("F");
    expect(params[3]).toEqual(["cbgv", "all"]);
    expect(id).toBe(9);
  });

  it("setDriveSourceEnabled: UPDATE đúng tham số", async () => {
    queryMock.mockResolvedValue({ rowCount: 1 });
    await setDriveSourceEnabled(5, false);
    const [sql, params] = lastCall();
    expect(sql).toContain("UPDATE drive_sources SET enabled");
    expect(params).toEqual([5, false]);
  });

  it("deleteDriveSource: trả bool theo rowCount", async () => {
    queryMock.mockResolvedValue({ rowCount: 1 });
    expect(await deleteDriveSource(5)).toBe(true);
    queryMock.mockResolvedValue({ rowCount: 0 });
    expect(await deleteDriveSource(5)).toBe(false);
  });

  it("listUsers: map is_admin -> isAdmin", async () => {
    queryMock.mockResolvedValue({
      rows: [{ id: 1, email: "a@hpu.edu.vn", name: "A", role: "cbgv", is_admin: true }],
    });
    const out = await listUsers();
    expect(out[0]).toEqual({ id: 1, email: "a@hpu.edu.vn", name: "A", role: "cbgv", isAdmin: true });
  });

  it("updateUserRole: UPDATE users đúng tham số", async () => {
    queryMock.mockResolvedValue({ rowCount: 1 });
    await updateUserRole(7, "admin", true);
    const [sql, params] = lastCall();
    expect(sql).toContain("UPDATE users SET role = $2, is_admin = $3");
    expect(params).toEqual([7, "admin", true]);
  });

  it("getOverview: ép kiểu số tất cả chỉ số", async () => {
    queryMock.mockResolvedValue({
      rows: [{
        conversations: "5", messages: "20", users: "3", user_messages: "10",
        thumbs_up: "4", thumbs_down: "1", gaps: "2",
      }],
    });
    const o = await getOverview();
    expect(o).toEqual({
      conversations: 5, messages: 20, users: 3, userMessages: 10,
      thumbsUp: 4, thumbsDown: 1, gaps: 2,
    });
  });

  it("usageByProduct: group theo product (chỉ tin assistant)", async () => {
    queryMock.mockResolvedValue({ rows: [{ product: "pmt-ems", count: "8" }] });
    const out = await usageByProduct();
    const [sql] = lastCall();
    expect(sql).toContain("role = 'assistant'");
    expect(sql).toContain("GROUP BY product");
    expect(out[0]).toEqual({ product: "pmt-ems", count: 8 });
  });

  it("recentGaps: LIMIT theo tham số, sắp xếp mới nhất", async () => {
    queryMock.mockResolvedValue({
      rows: [{ question: "abc?", product: "pmt-ems", role: "cbgv", created_at: "t" }],
    });
    const out = await recentGaps(20);
    const [sql, params] = lastCall();
    expect(sql).toContain("ORDER BY created_at DESC");
    expect(params).toEqual([20]);
    expect(out[0].question).toBe("abc?");
  });
});
