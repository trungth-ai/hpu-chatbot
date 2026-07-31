import { auth } from "@/auth";
import { deleteConversation } from "@/lib/db/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.uid) return Response.json({ error: "unauthorized" }, { status: 401 });
  const ok = await deleteConversation(params.id, session.user.uid);
  if (!ok) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ ok: true });
}
