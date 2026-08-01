import { pool } from "@/lib/db";
import type { Citation } from "@/lib/chat/stream";

export interface ConversationSummary {
  id: string;
  title: string | null;
  updatedAt: string;
}

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[] | null;
  createdAt: string;
}

export async function createConversation(
  userId: number,
  title: string | null = null,
): Promise<string> {
  const r = await pool.query(
    "INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id",
    [userId, title],
  );
  return r.rows[0].id;
}

export async function listConversations(userId: number): Promise<ConversationSummary[]> {
  const r = await pool.query(
    "SELECT id, title, updated_at FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 100",
    [userId],
  );
  return r.rows.map((x) => ({ id: x.id, title: x.title, updatedAt: x.updated_at }));
}

export async function conversationOwned(conversationId: string, userId: number): Promise<boolean> {
  const r = await pool.query(
    "SELECT 1 FROM conversations WHERE id = $1 AND user_id = $2",
    [conversationId, userId],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function getMessages(
  conversationId: string,
  userId: number,
): Promise<StoredMessage[]> {
  // Kiểm tra sở hữu ngay trong câu lệnh (join sang conversations theo user_id)
  const r = await pool.query(
    `SELECT m.id, m.role, m.content, m.citations, m.created_at
     FROM messages m
     JOIN conversations c ON c.id = m.conversation_id
     WHERE m.conversation_id = $1 AND c.user_id = $2
     ORDER BY m.created_at ASC`,
    [conversationId, userId],
  );
  return r.rows.map((x) => ({
    id: x.id,
    role: x.role,
    content: x.content,
    citations: x.citations,
    createdAt: x.created_at,
  }));
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  citations: Citation[] | null,
  product: string | null,
  channel = "web",
): Promise<string> {
  const r = await pool.query(
    `INSERT INTO messages (conversation_id, role, content, citations, product, channel)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [conversationId, role, content, citations ? JSON.stringify(citations) : null, product, channel],
  );
  return r.rows[0].id;
}

export async function setTitleIfEmpty(conversationId: string, title: string): Promise<void> {
  await pool.query(
    "UPDATE conversations SET title = $2 WHERE id = $1 AND (title IS NULL OR title = '')",
    [conversationId, title],
  );
}

export async function touchConversation(conversationId: string): Promise<void> {
  await pool.query("UPDATE conversations SET updated_at = now() WHERE id = $1", [conversationId]);
}

export async function deleteConversation(conversationId: string, userId: number): Promise<boolean> {
  const r = await pool.query(
    "DELETE FROM conversations WHERE id = $1 AND user_id = $2",
    [conversationId, userId],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function messageOwned(messageId: string, userId: number): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM messages m
     JOIN conversations c ON c.id = m.conversation_id
     WHERE m.id = $1 AND c.user_id = $2`,
    [messageId, userId],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function saveFeedback(
  messageId: string,
  userId: number,
  rating: number,
  comment: string | null,
): Promise<void> {
  await pool.query(
    "INSERT INTO feedback (message_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)",
    [messageId, userId, rating, comment],
  );
}


// ---- Lớp 2: bộ nhớ hội thoại (summary + số tin đã bao phủ) ----
export interface ConversationMemory {
  summary: string | null;
  summaryUpto: number;
}

export async function getConversationMemory(conversationId: string): Promise<ConversationMemory> {
  const r = await pool.query(
    "SELECT summary, summary_upto FROM conversations WHERE id = $1",
    [conversationId],
  );
  const row = r.rows[0];
  return { summary: row?.summary ?? null, summaryUpto: Number(row?.summary_upto ?? 0) };
}

export async function setConversationMemory(
  conversationId: string,
  summary: string,
  upto: number,
): Promise<void> {
  await pool.query(
    "UPDATE conversations SET summary = $2, summary_upto = $3 WHERE id = $1",
    [conversationId, summary, upto],
  );
}
