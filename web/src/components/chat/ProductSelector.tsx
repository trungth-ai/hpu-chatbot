"use client";

import { useEffect, useState } from "react";
import { PRODUCTS } from "@/lib/rag/products";

interface Option {
  id: string;
  label: string;
}

const FALLBACK: Option[] = PRODUCTS.map((p) => ({ id: p.id, label: p.label }));

export function ProductSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [options, setOptions] = useState<Option[]>(FALLBACK);

  useEffect(() => {
    let alive = true;
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && Array.isArray(d?.products) && d.products.length) setOptions(d.products);
      })
      .catch(() => {
        /* giữ danh mục fallback */
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <label className="flex items-center gap-2">
      <span className="hidden text-xs text-hpu-muted sm:inline">Phần mềm:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[42vw] truncate rounded-lg border border-hpu-border bg-white px-2.5 py-1.5 text-sm text-hpu-ink outline-none focus:border-hpu-primary sm:max-w-none"
      >
        <option value="">Tự động</option>
        {options.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
    </label>
  );
}
