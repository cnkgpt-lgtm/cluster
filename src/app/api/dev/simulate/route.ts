import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isMockMode } from "@/lib/midtrans";
import { prosesHasilPembayaran } from "@/lib/pembayaran-service";

export const dynamic = "force-dynamic";

// Simulator webhook untuk mode MOCK_PAYMENT=true (pengembangan tanpa kunci Midtrans).
// Dinonaktifkan total saat mode mock mati.
// Hasil audit keamanan run-1: wajib cek kepemilikan — user hanya boleh
// mensimulasikan pembayarannya sendiri (pengelola boleh semua).
const PENGELOLA = ["PENGURUS", "BENDAHARA", "SEKRETARIS"];
const schema = z.object({
  pembayaranId: z.string().min(1),
  hasil: z.enum(["PAID", "FAILED", "EXPIRED"]),
});

export async function POST(req: NextRequest) {
  if (!isMockMode()) {
    return NextResponse.json({ error: "FORBIDDEN", detail: "hanya aktif saat MOCK_PAYMENT=true" }, { status: 403 });
  }
  const session = await auth();
  const me = session?.user as { id?: string; role?: string } | undefined;
  if (!me?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const target = await prisma.pembayaran.findUnique({
    where: { id: parsed.data.pembayaranId },
    select: { userId: true },
  });
  if (!target) return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  if (target.userId !== me.id && !PENGELOLA.includes(me.role ?? "")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    await prosesHasilPembayaran(parsed.data.pembayaranId, parsed.data.hasil);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "UNKNOWN" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
