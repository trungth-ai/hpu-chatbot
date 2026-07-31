"use client";

import { PRODUCTS } from "@/lib/rag/products";

export function ProductSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="hidden text-xs text-hpu-muted sm:inline">Phần mềm:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[42vw] truncate rounded-lg border border-hpu-border bg-white px-2.5 py-1.5 text-sm text-hpu-ink outline-none focus:border-hpu-primary sm:max-w-none"
      >
        <option value="">Tự động</option>
        {PRODUCTS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
    </label>
  );
}
