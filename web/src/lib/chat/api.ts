import type { Citation } from "./stream";
import type { ConversationSummary, ChatMessage } from "./types";

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const r = await fetch("/api/conversations");
  if (!r.ok) return [];
  const data = (await r.json()) as { conversations: { id: string; title: string | null }[] };
  return data.conversations.map((c) => ({ id: c.id, title: c.title }));
}

interface ServerMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[] | null;
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const r = await fetch(`/api/conversations/${conversationId}/messages`);
  if (!r.ok) return [];
  const data = (await r.json()) as { messages: ServerMessage[] };
  return data.messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    citations: m.citations ?? undefined,
    messageId: m.role === "assistant" ? m.id : undefined,
  }));
}

export async function deleteConversation(conversationId: string): Promise<boolean> {
  const r = await fetch(`/api/conversations/${conversationId}`, { method: "DELETE" });
  return r.ok;
}

export async function sendFeedback(messageId: string, rating: 1 | -1): Promise<boolean> {
  const r = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId, rating }),
  });
  return r.ok;
}
