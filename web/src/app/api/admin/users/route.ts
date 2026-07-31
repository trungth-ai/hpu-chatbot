import { auth } from "@/auth";
import { isAdminSession } from "@/lib/auth/guard";
import { listUsers } from "@/lib/db/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminSession(await auth())) return Response.json({ error: "forbidden" }, { status: 403 });
  return Response.json({ users: await listUsers() });
}
