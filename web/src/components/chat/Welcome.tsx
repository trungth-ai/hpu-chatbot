"use client";

import { HpuLogo } from "@/components/HpuLogo";
import { suggestionsForRole } from "@/lib/chat/suggestions";

export function Welcome({
  role,
  firstName,
  onPick,
}: {
  role?: string;
  firstName?: string;
  onPick: (prompt: string) => void;
}) {
  const suggestions = suggestionsForRole(role);

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-hpu-primary">
        <HpuLogo className="h-9 w-9 text-white" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-hpu-ink">
        Chào {firstName ? firstName : "anh/chị"} 👋 Em là Trợ lý HPU
      </h1>
      <p className="mt-2 max-w-md text-hpu-muted">
        Em giúp anh/chị tra cứu cách dùng các phần mềm của trường. Cứ hỏi tự nhiên, phần khó để em lo 😎
      </p>

      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => onPick(s.prompt)}
            className="group rounded-2xl border border-hpu-border bg-hpu-surface px-4 py-3 text-left transition-all hover:border-hpu-primary hover:shadow-sm"
          >
            <p className="font-semibold text-hpu-dark">{s.label}</p>
            <p className="mt-0.5 line-clamp-1 text-sm text-hpu-muted">{s.prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
