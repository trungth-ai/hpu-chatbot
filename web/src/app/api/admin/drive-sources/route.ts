import { auth } from "@/auth";
import { isAdminSession } from "@/lib/auth/guard";
import { listDriveSources, createDriveSource } from "@/lib/db/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminSession(await auth())) return Response.json({ error: "forbidden" }, { status: 403 });
  return Response.json({ sources: await listDriveSources() });
}

export async function POST(req: Request) {
  if (!isAdminSession(await auth())) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: {
    folderId?: string;
    product?: string;
    module?: string;
    roleScope?: string[];
    version?: string;
  } = {};
  try {
    b = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const product = (b.product ?? "").trim().toLowerCase();
  if (!b.folderId || !product) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  const roleScope = Array.isArray(b.roleScope) && b.roleScope.length ? b.roleScope : ["all"];
  const id = await createDriveSource({
    folderId: b.folderId,
    product,
    module: b.module ?? null,
    roleScope,
    version: b.version ?? null,
  });
  return Response.json({ id });
}
