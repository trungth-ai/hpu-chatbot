export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="Đang soạn câu trả lời">
      <span className="h-2 w-2 animate-bounce rounded-full bg-hpu-primary [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-hpu-primary [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-hpu-primary" />
    </span>
  );
}
