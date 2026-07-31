import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Lưới an toàn: nếu model lỡ trả về LaTeX, đổi các lệnh phổ biến sang ký tự Unicode
// để không hiện ra chuỗi thô như "$\rightarrow$".
function cleanLatex(s: string): string {
  return s
    .replace(/\$\s*\\(?:long)?rightarrow\s*\$/g, " → ")
    .replace(/\$\s*\\Rightarrow\s*\$/g, " ⇒ ")
    .replace(/\$\s*\\(?:long)?leftarrow\s*\$/g, " ← ")
    .replace(/\\(?:long)?rightarrow\b/g, "→")
    .replace(/\\Rightarrow\b/g, "⇒")
    .replace(/\\(?:long)?leftarrow\b/g, "←")
    .replace(/\\to\b/g, "→")
    .replace(/\\times\b/g, "×")
    .replace(/\\leq\b/g, "≤")
    .replace(/\\geq\b/g, "≥");
}

// Render Markdown của câu trả lời bot, style theo brand HPU.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-[15px] leading-relaxed text-hpu-ink">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: (p) => <p className="mb-3 last:mb-0" {...p} />,
          ul: (p) => <ul className="mb-3 list-disc space-y-1 pl-5" {...p} />,
          ol: (p) => <ol className="mb-3 list-decimal space-y-1 pl-5" {...p} />,
          li: (p) => <li className="leading-relaxed" {...p} />,
          strong: (p) => <strong className="font-semibold text-hpu-dark" {...p} />,
          a: (p) => (
            <a
              className="font-medium text-hpu-primary underline underline-offset-2 hover:text-hpu-dark"
              target="_blank"
              rel="noopener noreferrer"
              {...p}
            />
          ),
          h1: (p) => <h1 className="mb-2 mt-1 text-lg font-bold" {...p} />,
          h2: (p) => <h2 className="mb-2 mt-1 text-base font-bold" {...p} />,
          h3: (p) => <h3 className="mb-2 mt-1 text-base font-semibold" {...p} />,
          code: (p) => (
            <code
              className="rounded bg-hpu-tint px-1.5 py-0.5 font-mono text-[13px] text-hpu-dark"
              {...p}
            />
          ),
          pre: (p) => (
            <pre
              className="mb-3 overflow-x-auto rounded-lg bg-hpu-ink/95 p-3 font-mono text-[13px] text-white"
              {...p}
            />
          ),
          table: (p) => (
            <div className="mb-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...p} />
            </div>
          ),
          th: (p) => (
            <th className="border border-hpu-border bg-hpu-tint px-2 py-1 text-left font-semibold" {...p} />
          ),
          td: (p) => <td className="border border-hpu-border px-2 py-1" {...p} />,
        }}
      >
        {cleanLatex(children)}
      </ReactMarkdown>
    </div>
  );
}
