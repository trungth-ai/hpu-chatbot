import { auth } from "@/auth";
import { parseRating } from "@/lib/chat/feedback";
import { saveFeedback, messageOwned } from "@/lib/db/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.uid) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body: { messageId?: string; rating?: unknown; comment?: string } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const messageId = (body.messageId ?? "").toString();
  const rating = parseRating(body.rating);
  if (!messageId || rating === null) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  // Chỉ cho phản hồi tin nhắn thuộc hội thoại của chính mình
  if (!(await messageOwned(messageId, session.user.uid))) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  await saveFeedback(messageId, session.user.uid, rating, body.comment ?? null);
  return Response.json({ ok: true });
}
