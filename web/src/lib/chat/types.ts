import type { Citation } from "./stream";

export interface ChatMessage {
  id: string; // id phía client (React key)
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  pending?: boolean; // đang stream
  messageId?: string; // id trong DB (dùng cho phản hồi 👍/👎)
  feedback?: 1 | -1; // đã đánh giá
}

export interface ConversationSummary {
  id: string;
  title: string | null;
}
