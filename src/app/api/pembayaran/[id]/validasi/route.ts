import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { prosesHasilPembayaran } from "@/lib/pembayaran-service";
import { perluValidasiBendahara } from "@/lib/pembayaran";

export const dynamic = "force-dynamic";

const schema = z.object({
  keputusan: z.enum(["TERIMA", "TOLAK"]),
  catatan: z.string().max(500).optional(),
});

// PATCH /api/pembayaran/[id]/validasi — Bendahara/Pengurus memvalidasi bukti transfer manual
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (role !== "BENDAHARA" && role !== "PENGURUS") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const validator = session.user as { id: string };

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const pembayaran = await prisma.pembayaran.findUnique({ where: { id } });
  if (!pembayaran) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  // Hanya metode yang wajib divalidasi (VA/transfer manual) dan masih menunggu.
  if (!perluValidasiBendahara(pembayaran.metode) || pembayaran.status !== "MENUNGGU_VALIDASI") {
    return NextResponse.json({ error: "INVALID_STATE" }, { status: 400 });
  }

  const statusBaru = parsed.data.keputusan === "TERIMA" ? "PAID" : "DITOLAK";
  await prisma.pembayaran.update({
    where: { id },
    data: {
      validatedById: validator.id,
      validatedAt: new Date(),
      catatan: parsed.data.catatan,
    },
  });
  await prosesHasilPembayaran(id, statusBaru, { viaValidasiBendahara: true });

  return NextResponse.json({ ok: true, status: statusBaru });
}
