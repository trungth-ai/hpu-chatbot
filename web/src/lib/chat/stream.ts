// Định dạng sự kiện stream (NDJSON, mỗi dòng 1 JSON).
export type ChatStreamEvent =
  | { type: "meta"; conversationId: string }
  | { type: "token"; value: string }
  | { type: "done"; citations?: Citation[]; messageId?: string }
  | { type: "error"; message: string };

export interface Citation {
  source_file: string;
  section?: string;
  page?: number;
  source_url?: string;
  image_url?: string;
}

export interface StreamHandlers {
  onMeta?: (conversationId: string) => void;
  onToken: (value: string) => void;
  onDone: (citations: Citation[], messageId?: string) => void;
  onError: (message: string) => void;
}

export async function streamChat(
  body: { message: string; conversationId?: string; product?: string },
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    handlers.onError("Không kết nối được máy chủ. Anh/chị thử lại sau nhé.");
    return;
  }

  if (!res.ok || !res.body) {
    let msg = "Có lỗi khi xử lý yêu cầu. Anh/chị thử lại giúp em nhé 🙏";
    try {
      const j = (await res.json()) as { message?: string };
      if (j?.message) msg = j.message;
    } catch {
      // giữ thông báo mặc định
    }
    handlers.onError(msg);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const ev = JSON.parse(line) as ChatStreamEvent;
        if (ev.type === "meta") handlers.onMeta?.(ev.conversationId);
        else if (ev.type === "token") handlers.onToken(ev.value);
        else if (ev.type === "done") handlers.onDone(ev.citations ?? [], ev.messageId);
        else if (ev.type === "error") handlers.onError(ev.message);
      } catch {
        // bỏ qua dòng hỏng
      }
    }
  }
}
