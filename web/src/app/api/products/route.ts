import { auth } from "@/auth";
import { listActiveProducts } from "@/lib/db/admin";
import { mergeProductOptions } from "@/lib/rag/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Trả về danh mục phần mềm cho bộ chọn: danh mục cứng + mọi product đang có nội dung trong kho.
export async function GET() {
  const session = await auth();
  if (!session?.user?.uid) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const active = await listActiveProducts();
    return Response.json({ products: mergeProductOptions(active.map((a) => a.product)) });
  } catch {
    // Lỗi DB -> để client tự fallback về danh mục cứng
    return Response.json({ products: [] });
  }
}
