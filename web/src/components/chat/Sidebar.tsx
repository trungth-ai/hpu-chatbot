"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { HpuLogo } from "@/components/HpuLogo";
import { Plus, MessageSquare, LogOut, X, Trash2, Shield, PanelLeftClose } from "lucide-react";
import type { ConversationSummary } from "@/lib/chat/types";

interface SidebarProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  user?: { name?: string | null; image?: string | null; role?: string; isAdmin?: boolean };
  open: boolean;
  collapsed?: boolean;
  onClose: () => void;
  onCollapse?: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function Sidebar({
  conversations,
  activeId,
  user,
  open,
  collapsed,
  onClose,
  onCollapse,
  onNew,
  onSelect,
  onDelete,
}: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Khung giữ chỗ (desktop): co chiều rộng để panel TRƯỢT NGANG về trái và nhường chỗ cho khung chat */}
      <div
        className={`w-0 shrink-0 transition-[width] duration-300 ease-in-out md:overflow-hidden ${
          collapsed ? "md:w-0" : "md:w-72"
        }`}
      >
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex h-full w-[86vw] max-w-[20rem] flex-col bg-hpu-dark p-4 text-white transition-transform duration-300 ease-in-out md:static md:h-full md:w-72 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:-translate-x-full" : "md:translate-x-0"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HpuLogo className="h-8 w-8 text-white" />
            <span className="text-lg font-bold tracking-wide">Trợ lý HPU</span>
          </div>
          <button
            className="hidden rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white md:block"
            onClick={onCollapse}
            aria-label="Ẩn lịch sử"
            title="Ẩn lịch sử"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
          <button className="md:hidden" onClick={onClose} aria-label="Đóng menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={onNew}
          className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/20"
        >
          <Plus className="h-4 w-4" /> Cuộc trò chuyện mới
        </button>

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                c.id === activeId ? "bg-white/15 font-medium" : "text-white/80 hover:bg-white/10"
              }`}
            >
              <button
                onClick={() => onSelect(c.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">{c.title || "Cuộc trò chuyện mới"}</span>
              </button>
              <button
                onClick={() => onDelete(c.id)}
                aria-label="Xóa hội thoại"
                className="shrink-0 rounded p-1 text-white/50 opacity-0 transition-opacity hover:bg-white/15 hover:text-white group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </nav>

        <div className="mt-auto">
          {user?.isAdmin && (
            <Link
              href="/admin"
              className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
            >
              <Shield className="h-4 w-4" /> Quản trị
            </Link>
          )}
          <div className="border-t border-white/15 pt-4">
            <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user?.image ?? ""}
              alt=""
              className="h-9 w-9 rounded-full bg-white/20 object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-white/70">{roleLabel(user?.role)}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
          </div>
        </div>
      </aside>
      </div>
    </>
  );
}

function roleLabel(role?: string): string {
  switch (role) {
    case "admin":
      return "Quản trị viên";
    case "cbgv":
      return "Cán bộ / Giảng viên";
    case "sinh-vien":
      return "Sinh viên";
    case "phong-dao-tao":
      return "Phòng Đào tạo";
    default:
      return "Người dùng HPU";
  }
}
