import { pool } from "@/lib/db";
import { embedQuery } from "./gemini";
import type { RetrievedChunk } from "./prompt";

export async function retrieve(opts: {
  query: string;
  product?: string | null;
  products?: string[] | null; // danh sách phần mềm cho phép (kênh công khai)
  role: string;
  topK: number;
}): Promise<RetrievedChunk[]> {
  const vec = await embedQuery(opts.query);
  const vecLiteral = `[${vec.join(",")}]`;

  // Lọc: theo 1 product (nếu có) + theo allowlist (nếu có) + theo vai trò (admin xem hết).
  const sql = `
    SELECT content, source_file, source_url, page, section, image_url,
           1 - (embedding <=> $1::vector) AS score
    FROM kb_documents
    WHERE ($2::text IS NULL OR lower(product) = $2)
      AND ($5::text[] IS NULL OR lower(product) = ANY($5))
      AND ($3 = 'admin' OR role_scope && ARRAY[$3, 'all'])
    ORDER BY embedding <=> $1::vector
    LIMIT $4
  `;
  const product = opts.product ? opts.product.toLowerCase() : null;
  const products = opts.products ? opts.products.map((p) => p.toLowerCase()) : null;
  const res = await pool.query(sql, [
    vecLiteral,
    product,
    opts.role,
    opts.topK,
    products,
  ]);
  return res.rows.map((r) => ({
    content: r.content,
    source_file: r.source_file,
    section: r.section,
    page: r.page,
    source_url: r.source_url,
    image_url: r.image_url,
    score: Number(r.score),
  }));
}
