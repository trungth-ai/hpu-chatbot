import { auth } from "@/auth";
import { getMessages, conversationOwned } from "@/lib/db/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.uid) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!(await conversationOwned(params.id, session.user.uid))) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  const messages = await getMessages(params.id, session.user.uid);
  return Response.json({ messages });
}
