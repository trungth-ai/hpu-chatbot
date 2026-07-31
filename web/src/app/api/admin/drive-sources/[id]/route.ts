import { auth } from "@/auth";
import { isAdminSession } from "@/lib/auth/guard";
import { setDriveSourceEnabled, deleteDriveSource } from "@/lib/db/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAdminSession(await auth())) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: { enabled?: boolean } = {};
  try {
    b = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (typeof b.enabled !== "boolean") {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  await setDriveSourceEnabled(Number(params.id), b.enabled);
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!isAdminSession(await auth())) return Response.json({ error: "forbidden" }, { status: 403 });
  const ok = await deleteDriveSource(Number(params.id));
  return Response.json({ ok });
}
