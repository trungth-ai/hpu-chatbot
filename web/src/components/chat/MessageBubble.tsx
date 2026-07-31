import type { ChatMessage } from "@/lib/chat/types";
import { HpuLogo } from "@/components/HpuLogo";
import { Markdown } from "./Markdown";
import { TypingDots } from "./TypingDots";
import { Citations } from "./Citations";
import { Feedback } from "./Feedback";
import { CopyButton } from "./CopyButton";

export function MessageBubble({
  message,
  onFeedback,
}: {
  message: ChatMessage;
  onFeedback?: (messageId: string, rating: 1 | -1) => void;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm sm:max-w-[80%] bg-hpu-primary px-4 py-2.5 text-[15px] leading-relaxed text-white">
          {message.content}
        </div>
      </div>
    );
  }

  const showFeedback = !message.pending && message.messageId && onFeedback;

  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hpu-primary">
        <HpuLogo className="h-5 w-5 text-white" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm sm:max-w-[80%] bg-hpu-surface px-4 py-3 shadow-sm ring-1 ring-hpu-border">
        {message.pending && !message.content ? (
          <TypingDots />
        ) : (
          <>
            <Markdown>{message.content}</Markdown>
            {!message.pending && <Citations items={message.citations ?? []} />}
            {!message.pending && (
              <div className="mt-2 flex items-center gap-1">
                <CopyButton text={message.content} />
                {showFeedback && (
                  <Feedback
                    rating={message.feedback}
                    onRate={(r) => onFeedback!(message.messageId!, r)}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
