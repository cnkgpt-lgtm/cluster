import { NextRequest, NextResponse } from "next/server";
import { runSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

// POST /api/admin/seed — isi data awal (sekali pakai, idempoten).
// Dilindungi API key server (header x-api-key = NEXTAUTH_API_KEY).
// Dipanggil sekali setelah deploy pertama; aman dipanggil ulang.
export async function POST(req: NextRequest) {
  const apiKey = process.env.NEXTAUTH_API_KEY;
  const provided = req.headers.get("x-api-key");
  if (!apiKey || !provided || provided !== apiKey) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  try {
    const log = await runSeed();
    return NextResponse.json({ ok: true, log });
  } catch (e) {
    return NextResponse.json(
      { error: "SEED_FAILED", detail: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
