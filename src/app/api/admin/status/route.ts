import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/admin/status — health check internal.
// Dilindungi API key server (header x-api-key = NEXTAUTH_API_KEY).
// Berguna untuk monitoring/uptime check tanpa membuka sesi login.
export async function GET(req: NextRequest) {
  const apiKey = process.env.NEXTAUTH_API_KEY;
  const provided = req.headers.get("x-api-key");
  if (!apiKey || !provided || provided !== apiKey) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let db: "up" | "down" = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch {
    db = "down";
  }

  return NextResponse.json({ ok: true, db, time: new Date().toISOString() });
}
