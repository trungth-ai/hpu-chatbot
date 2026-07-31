"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/chat/types";
import { MessageBubble } from "./MessageBubble";

export function MessageList({
  messages,
  onFeedback,
}: {
  messages: ChatMessage[];
  onFeedback?: (messageId: string, rating: 1 | -1) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-3 py-5 sm:px-4 sm:py-6">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} onFeedback={onFeedback} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
