"use client";

import { ThumbsUp, ThumbsDown } from "lucide-react";

export function Feedback({
  rating,
  onRate,
}: {
  rating?: 1 | -1;
  onRate: (r: 1 | -1) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onRate(1)}
        aria-label="Hữu ích"
        aria-pressed={rating === 1}
        className={`rounded-md p-1.5 transition-colors hover:bg-hpu-tint ${
          rating === 1 ? "text-hpu-primary" : "text-hpu-muted"
        }`}
      >
        <ThumbsUp className="h-4 w-4" fill={rating === 1 ? "currentColor" : "none"} />
      </button>
      <button
        onClick={() => onRate(-1)}
        aria-label="Chưa hữu ích"
        aria-pressed={rating === -1}
        className={`rounded-md p-1.5 transition-colors hover:bg-hpu-tint ${
          rating === -1 ? "text-hpu-accent" : "text-hpu-muted"
        }`}
      >
        <ThumbsDown className="h-4 w-4" fill={rating === -1 ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
