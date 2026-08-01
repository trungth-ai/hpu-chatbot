"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Trash2, Loader2, ExternalLink } from "lucide-react";
import { HpuLogo } from "@/components/HpuLogo";
import { VALID_ROLES, ROLE_LABELS, type Role } from "@/lib/admin/roles";
import { containmentRate, satisfactionRate, toPercent } from "@/lib/admin/stats";

interface Source {
  id: number;
  folderId: string;
  product: string;
  module: string | null;
  roleScope: string[];
  version: string | null;
  enabled: boolean;
  lastSyncedAt: string | null;
  fileCount: number;
  chunkCount: number;
}
interface Overview {
  conversations: number;
  messages: number;
  users: number;
  userMessages: number;
  thumbsUp: number;
  thumbsDown: number;
  gaps: number;
}
interface Stats {
  overview: Overview;
  byProduct: { product: string; count: number }[];
  gaps: { question: string; product: string | null; role: string | null; createdAt: string }[];
}
interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  isAdmin: boolean;
}

type Tab = "sources" | "stats" | "users";

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("sources");
  const [sources, setSources] = useState<Source[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [s, st, u] = await Promise.all([
      fetch("/api/admin/drive-sources").then((r) => r.json()),
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
    ]);
    setSources(s.sources ?? []);
    setStats(st.overview ? st : null);
    setUsers(u.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };

  async function reloadSources() {
    const s = await fetch("/api/admin/drive-sources").then((r) => r.json());
    setSources(s.sources ?? []);
  }

  async function syncNow(sourceId?: number) {
    setSyncing(true);
    const res = await fetch("/api/admin/drive-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sourceId ? { sourceId } : {}),
    });
    const data = await res.json().catch(() => ({}));
    setSyncing(false);
    flash(res.ok ? "Đã gửi yêu cầu đồng bộ tới worker 🎉" : data.error ?? "Đồng bộ thất bại");
  }

  return (
    <div className="min-h-screen bg-hpu-bg">
      <header className="flex items-center justify-between border-b border-hpu-border bg-hpu-dark px-5 py-3 text-white">
        <div className="flex items-center gap-3">
          <HpuLogo className="h-7 w-7 text-white" />
          <span className="font-bold">Trợ lý HPU — Quản trị</span>
        </div>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Về trang chat
        </Link>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-hpu-border">
          {(
            [
              ["sources", "Tài liệu"],
              ["stats", "Thống kê"],
              ["users", "Người dùng"],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t
                  ? "border-hpu-primary text-hpu-primary"
                  : "border-transparent text-hpu-muted hover:text-hpu-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-hpu-primary" />
          </div>
        ) : (
          <>
            {tab === "sources" && (
              <SourcesTab
                sources={sources}
                syncing={syncing}
                onSync={syncNow}
                onReload={reloadSources}
                flash={flash}
              />
            )}
            {tab === "stats" && stats && <StatsTab stats={stats} />}
            {tab === "users" && (
              <UsersTab users={users} onReload={async () => {
                const u = await fetch("/api/admin/users").then((r) => r.json());
                setUsers(u.users ?? []);
              }} flash={flash} />
            )}
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-xl bg-hpu-ink px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ---------------- Tab Tài liệu ---------------- */
function SourcesTab({
  sources,
  syncing,
  onSync,
  onReload,
  flash,
}: {
  sources: Source[];
  syncing: boolean;
  onSync: (id?: number) => void;
  onReload: () => Promise<void>;
  flash: (m: string) => void;
}) {
  const [form, setForm] = useState({ folderId: "", product: "", module: "", roleScope: "all", version: "" });

  async function add() {
    if (!form.folderId || !form.product) {
      flash("Cần nhập Folder ID và mã phần mềm");
      return;
    }
    const res = await fetch("/api/admin/drive-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folderId: form.folderId,
        product: form.product,
        module: form.module || null,
        roleScope: form.roleScope.split(",").map((x) => x.trim()).filter(Boolean),
        version: form.version || null,
      }),
    });
    if (res.ok) {
      setForm({ folderId: "", product: "", module: "", roleScope: "all", version: "" });
      await onReload();
      flash("Đã thêm nguồn tài liệu ✓");
    } else flash("Thêm nguồn thất bại");
  }

  async function toggle(s: Source) {
    await fetch(`/api/admin/drive-sources/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !s.enabled }),
    });
    await onReload();
  }

  async function remove(id: number) {
    await fetch(`/api/admin/drive-sources/${id}`, { method: "DELETE" });
    await onReload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-hpu-ink">Nguồn tài liệu Google Drive</h2>
        <button
          onClick={() => onSync()}
          disabled={syncing}
          className="flex items-center gap-2 rounded-lg bg-hpu-primary px-4 py-2 text-sm font-semibold text-white hover:bg-hpu-dark disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          Đồng bộ tất cả
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-hpu-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-hpu-tint text-left text-hpu-dark">
            <tr>
              <th className="px-3 py-2">Phần mềm</th>
              <th className="px-3 py-2">Module</th>
              <th className="px-3 py-2">Vai trò</th>
              <th className="px-3 py-2">File</th>
              <th className="px-3 py-2">Chunk</th>
              <th className="px-3 py-2">Đồng bộ lần cuối</th>
              <th className="px-3 py-2">Bật</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-hpu-muted">
                  Chưa có nguồn nào. Thêm bên dưới rồi bấm Đồng bộ.
                </td>
              </tr>
            )}
            {sources.map((s) => (
              <tr key={s.id} className="border-t border-hpu-border">
                <td className="px-3 py-2 font-medium">
                  <a
                    href={`https://drive.google.com/drive/folders/${s.folderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Mở thư mục Drive (ID: ${s.folderId})`}
                    className="inline-flex items-center gap-1 text-hpu-primary hover:underline"
                  >
                    {s.product}
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                </td>
                <td className="px-3 py-2 text-hpu-muted">{s.module ?? "—"}</td>
                <td className="px-3 py-2 text-hpu-muted">{s.roleScope.join(", ")}</td>
                <td className="px-3 py-2">{s.fileCount}</td>
                <td className="px-3 py-2">{s.chunkCount}</td>
                <td className="px-3 py-2 text-hpu-muted">
                  {s.lastSyncedAt ? new Date(s.lastSyncedAt).toLocaleString("vi-VN") : "chưa"}
                </td>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={s.enabled} onChange={() => toggle(s)} />
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => onSync(s.id)} className="mr-2 text-hpu-primary hover:underline">
                    Đồng bộ
                  </button>
                  <button onClick={() => remove(s.id)} aria-label="Xóa" className="text-hpu-accent">
                    <Trash2 className="inline h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form thêm nguồn */}
      <div className="rounded-xl border border-hpu-border bg-white p-4">
        <h3 className="mb-3 font-semibold text-hpu-ink">Thêm nguồn tài liệu</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input className="rounded-lg border border-hpu-border px-3 py-2 text-sm" placeholder="Folder ID (Drive)"
            value={form.folderId} onChange={(e) => setForm({ ...form, folderId: e.target.value })} />
          <input className="rounded-lg border border-hpu-border px-3 py-2 text-sm" placeholder="Mã phần mềm (pmt-ems)"
            value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
          <input className="rounded-lg border border-hpu-border px-3 py-2 text-sm" placeholder="Module (dao-tao)"
            value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} />
          <input className="rounded-lg border border-hpu-border px-3 py-2 text-sm" placeholder="Vai trò (all hoặc cbgv,sinh-vien)"
            value={form.roleScope} onChange={(e) => setForm({ ...form, roleScope: e.target.value })} />
          <input className="rounded-lg border border-hpu-border px-3 py-2 text-sm" placeholder="Phiên bản (v1)"
            value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
        </div>
        <button onClick={add} className="mt-3 rounded-lg bg-hpu-primary px-4 py-2 text-sm font-semibold text-white hover:bg-hpu-dark">
          Thêm nguồn
        </button>
      </div>
    </div>
  );
}

/* ---------------- Tab Thống kê ---------------- */
function StatsTab({ stats }: { stats: Stats }) {
  const o = stats.overview;
  const containment = containmentRate(o.userMessages, o.gaps);
  const satis = satisfactionRate(o.thumbsUp, o.thumbsDown);

  const cards = [
    ["Hội thoại", o.conversations],
    ["Câu hỏi", o.userMessages],
    ["Người dùng", o.users],
    ["Tự trả lời", toPercent(containment)],
    ["Hài lòng", satis === null ? "—" : toPercent(satis)],
    ["Chưa trả lời được", o.gaps],
  ] as [string, string | number][];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, val]) => (
          <div key={label} className="rounded-xl border border-hpu-border bg-white p-4">
            <p className="text-2xl font-bold text-hpu-primary">{val}</p>
            <p className="mt-1 text-xs text-hpu-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-hpu-border bg-white p-4">
          <h3 className="mb-3 font-semibold text-hpu-ink">Lưu lượng theo phần mềm</h3>
          {stats.byProduct.length === 0 ? (
            <p className="text-sm text-hpu-muted">Chưa có dữ liệu.</p>
          ) : (
            <ul className="space-y-2">
              {stats.byProduct.map((p) => (
                <li key={p.product} className="flex justify-between text-sm">
                  <span>{p.product}</span>
                  <span className="font-semibold">{p.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-hpu-border bg-white p-4">
          <h3 className="mb-3 font-semibold text-hpu-ink">Câu hỏi chưa trả lời được (khoảng trống tri thức)</h3>
          {stats.gaps.length === 0 ? (
            <p className="text-sm text-hpu-muted">Tuyệt vời, chưa có khoảng trống nào 🎉</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {stats.gaps.map((g, i) => (
                <li key={i} className="border-b border-hpu-border pb-2 text-sm">
                  <p className="text-hpu-ink">{g.question}</p>
                  <p className="text-xs text-hpu-muted">
                    {[g.product, g.role].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Tab Người dùng ---------------- */
function UsersTab({
  users,
  onReload,
  flash,
}: {
  users: AdminUser[];
  onReload: () => Promise<void>;
  flash: (m: string) => void;
}) {
  async function changeRole(u: AdminUser, role: Role) {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, isAdmin: role === "admin" }),
    });
    if (res.ok) {
      await onReload();
      flash("Đã cập nhật vai trò ✓");
    } else flash("Cập nhật thất bại");
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-hpu-border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-hpu-tint text-left text-hpu-dark">
          <tr>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Tên</th>
            <th className="px-3 py-2">Vai trò</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-hpu-border">
              <td className="px-3 py-2">{u.email}</td>
              <td className="px-3 py-2 text-hpu-muted">{u.name ?? "—"}</td>
              <td className="px-3 py-2">
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u, e.target.value as Role)}
                  className="rounded-lg border border-hpu-border px-2 py-1 text-sm"
                >
                  {VALID_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
