import { auth } from "@/auth";
import { isAdminSession } from "@/lib/auth/guard";
import { updateUserRole } from "@/lib/db/admin";
import { isValidRole } from "@/lib/admin/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAdminSession(await auth())) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: { role?: unknown; isAdmin?: unknown } = {};
  try {
    b = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!isValidRole(b.role)) {
    return Response.json({ error: "invalid_role" }, { status: 400 });
  }
  const isAdmin = Boolean(b.isAdmin) || b.role === "admin";
  await updateUserRole(Number(params.id), b.role, isAdmin);
  return Response.json({ ok: true });
}
