import { sql } from "drizzle-orm";
import { systemDb } from "@/db/server";

export const dynamic = "force-dynamic";

/** Liveness/readiness probe for the hosting platform. Reveals no data. */
export async function GET() {
  try {
    await systemDb().execute(sql`select 1`);
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "degraded" }, { status: 503 });
  }
}
