import { pool } from "@/lib/db";

export async function logKnowledgeGap(g: {
  question: string;
  product?: string | null;
  role?: string;
  channel?: string;
}): Promise<void> {
  try {
    await pool.query(
      "INSERT INTO knowledge_gaps (question, product, role, channel) VALUES ($1, $2, $3, $4)",
      [g.question, g.product ?? null, g.role ?? null, g.channel ?? "web"],
    );
  } catch (e) {
    console.error("Ghi knowledge_gaps lỗi:", e);
  }
}
