import { auth } from "@/auth";
import { listConversations, createConversation } from "@/lib/db/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.uid) return Response.json({ error: "unauthorized" }, { status: 401 });
  const conversations = await listConversations(session.user.uid);
  return Response.json({ conversations });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.uid) return Response.json({ error: "unauthorized" }, { status: 401 });
  const id = await createConversation(session.user.uid);
  return Response.json({ id });
}
