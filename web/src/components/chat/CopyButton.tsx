"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      // trình duyệt chặn clipboard -> bỏ qua
    }
  }
  return (
    <button
      onClick={copy}
      aria-label="Sao chép"
      className="rounded-md p-1.5 text-hpu-muted transition-colors hover:bg-hpu-tint"
    >
      {done ? <Check className="h-4 w-4 text-hpu-primary" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
