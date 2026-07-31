import type { Citation } from "@/lib/chat/stream";
import { FileText } from "lucide-react";

export function Citations({ items }: { items: Citation[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3 border-t border-hpu-border pt-2">
      <p className="mb-1.5 text-xs font-semibold text-hpu-muted">📄 Nguồn tham khảo</p>
      <ul className="space-y-1">
        {items.map((c, i) => {
          const label = [c.source_file, c.section, c.page ? `tr.${c.page}` : null]
            .filter(Boolean)
            .join(" — ");
          return (
            <li key={i} className="flex items-start gap-1.5 text-xs text-hpu-muted">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-hpu-primary" />
              {c.source_url ? (
                <a
                  href={c.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-hpu-primary underline underline-offset-2 hover:text-hpu-dark"
                >
                  {label}
                </a>
              ) : (
                <span>{label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
