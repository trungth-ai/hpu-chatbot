"use client";

import { useCallback, useEffect, useState } from "react";
import { Menu, Loader2, PanelLeft } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Welcome } from "./Welcome";
import { ProductSelector } from "./ProductSelector";
import { streamChat, type Citation } from "@/lib/chat/stream";
import {
  fetchConversations,
  fetchMessages,
  deleteConversation as apiDelete,
  sendFeedback,
} from "@/lib/chat/api";
import type { ChatMessage, ConversationSummary } from "@/lib/chat/types";

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export interface ChatUser {
  name?: string | null;
  image?: string | null;
  role?: string;
  isAdmin?: boolean;
}

export function ChatApp({ user }: { user: ChatUser }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null); // null = hội thoại mới (chưa lưu)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [product, setProduct] = useState(""); // "" = tự động định tuyến
  const [collapsed, setCollapsed] = useState(false); // thu/giấu lịch sử (desktop)

  const firstName = user.name?.split(" ").slice(-1)[0];

  const refreshConversations = useCallback(async () => {
    setConversations(await fetchConversations());
  }, []);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  // Cập nhật 1 tin trong danh sách hiện tại
  const patchMessage = useCallback((id: string, fn: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) return;
      const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
      const botLocalId = uid();
      const botMsg: ChatMessage = {
        id: botLocalId,
        role: "assistant",
        content: "",
        pending: true,
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      setIsStreaming(true);

      let createdNew = activeId === null;

      await streamChat(
        { message: text, conversationId: activeId ?? undefined, product: product || undefined },
        {
          onMeta: (conversationId) => {
            if (activeId !== conversationId) setActiveId(conversationId);
          },
          onToken: (v) =>
            patchMessage(botLocalId, (m) => ({ ...m, content: m.content + v })),
          onDone: (citations: Citation[], messageId?: string) => {
            patchMessage(botLocalId, (m) => ({
              ...m,
              pending: false,
              citations,
              messageId,
            }));
          },
          onError: (msg) =>
            patchMessage(botLocalId, (m) => ({
              ...m,
              pending: false,
              // Giữ phần đã stream (nếu có), thêm ghi chú lỗi
              content: m.content ? `${m.content}

_${msg}_` : msg,
            })),
        },
      );

      setIsStreaming(false);
      // Cập nhật danh sách (tiêu đề/thứ tự có thể đã đổi; hội thoại mới được thêm)
      await refreshConversations();
      void createdNew;
    },
    [activeId, isStreaming, patchMessage, refreshConversations, product],
  );

  const handleSelect = useCallback(
    async (id: string) => {
      if (isStreaming || id === activeId) {
        setSidebarOpen(false);
        return;
      }
      setActiveId(id);
      setSidebarOpen(false);
      setLoadingMessages(true);
      setMessages(await fetchMessages(id));
      setLoadingMessages(false);
    },
    [activeId, isStreaming],
  );

  const handleNew = useCallback(() => {
    if (isStreaming) return;
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
  }, [isStreaming]);

  const handleDelete = useCallback(
    async (id: string) => {
      const ok = await apiDelete(id);
      if (!ok) return;
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === activeId) {
        setActiveId(null);
        setMessages([]);
      }
    },
    [activeId],
  );

  const handleFeedback = useCallback(
    async (messageId: string, rating: 1 | -1) => {
      // Cập nhật lạc quan, lỗi thì hoàn lại
      let prevRating: 1 | -1 | undefined;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.messageId === messageId) {
            prevRating = m.feedback;
            return { ...m, feedback: rating };
          }
          return m;
        }),
      );
      const ok = await sendFeedback(messageId, rating);
      if (!ok) {
        setMessages((prev) =>
          prev.map((m) => (m.messageId === messageId ? { ...m, feedback: prevRating } : m)),
        );
      }
    },
    [],
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[100dvh]">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        user={user}
        open={sidebarOpen}
        collapsed={collapsed}
        onClose={() => setSidebarOpen(false)}
        onCollapse={() => setCollapsed(true)}
        onNew={handleNew}
        onSelect={handleSelect}
        onDelete={handleDelete}
      />

      <div className="flex flex-1 flex-col bg-hpu-bg">
        <header className="flex items-center justify-between border-b border-hpu-border bg-hpu-surface px-4 py-2.5">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} aria-label="Mở menu" className="md:hidden">
              <Menu className="h-5 w-5 text-hpu-ink" />
            </button>
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Hiện lịch sử" : "Ẩn lịch sử"}
              title={collapsed ? "Hiện lịch sử" : "Ẩn lịch sử"}
              className="hidden text-hpu-ink transition-colors hover:text-hpu-primary md:block"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <span className="font-semibold text-hpu-ink md:hidden">Trợ lý HPU</span>
          </div>
          <ProductSelector value={product} onChange={setProduct} />
        </header>

        <div className="flex-1 overflow-y-auto">
          {loadingMessages ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-hpu-primary" />
            </div>
          ) : isEmpty ? (
            <Welcome role={user.role} firstName={firstName} onPick={handleSend} />
          ) : (
            <MessageList messages={messages} onFeedback={handleFeedback} />
          )}
        </div>

        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
