import { pingDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const dbOk = await pingDb();
  return Response.json(
    { status: "ok", db: dbOk ? "ok" : "error" },
    { status: dbOk ? 200 : 503 },
  );
}
