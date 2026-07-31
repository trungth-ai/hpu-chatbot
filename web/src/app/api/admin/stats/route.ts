import { auth } from "@/auth";
import { isAdminSession } from "@/lib/auth/guard";
import { getOverview, usageByProduct, recentGaps } from "@/lib/db/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminSession(await auth())) return Response.json({ error: "forbidden" }, { status: 403 });
  const [overview, byProduct, gaps] = await Promise.all([
    getOverview(),
    usageByProduct(),
    recentGaps(50),
  ]);
  return Response.json({ overview, byProduct, gaps });
}
