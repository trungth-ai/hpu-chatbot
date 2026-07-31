import { auth } from "@/auth";
import { isAdminSession } from "@/lib/auth/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INGEST_URL = process.env.INGEST_URL ?? "http://ingest:8787";

export async function POST(req: Request) {
  if (!isAdminSession(await auth())) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: { sourceId?: number } = {};
  try {
    b = await req.json();
  } catch {
    b = {};
  }
  try {
    const res = await fetch(`${INGEST_URL}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b.sourceId ? { source_id: b.sourceId } : {}),
    });
    const data = await res.json().catch(() => ({}));
    return Response.json({ ok: res.ok, worker: data }, { status: res.ok ? 200 : 502 });
  } catch {
    return Response.json(
      { ok: false, error: "Không kết nối được worker đồng bộ (kiểm tra service 'ingest')." },
      { status: 502 },
    );
  }
}
