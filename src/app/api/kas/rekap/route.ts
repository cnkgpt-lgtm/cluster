import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function bolehLihat(role?: string) {
  return role === "BENDAHARA" || role === "PENGURUS";
}

// GET /api/kas/rekap?bulan=2026-10 — rekapitulasi kas (Bendahara/Pengurus)
export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!bolehLihat(role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const bulan = searchParams.get("bulan") ?? new Date().toISOString().slice(0, 7);
  const m = bulan.match(/^(\d{4})-(\d{2})$/);
  if (!m) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const awal = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  const akhir = new Date(Number(m[1]), Number(m[2]), 1);

  const [masuk, keluar, daftarMasuk, daftarKeluar] = await Promise.all([
    prisma.pembayaran.aggregate({
      where: { status: "PAID", paidAt: { gte: awal, lt: akhir } },
      _sum: { nominal: true },
      _count: true,
    }),
    prisma.pengeluaranKas.aggregate({
      where: { tanggal: { gte: awal, lt: akhir } },
      _sum: { nominal: true },
      _count: true,
    }),
    prisma.pembayaran.findMany({
      where: { status: "PAID", paidAt: { gte: awal, lt: akhir } },
      orderBy: { paidAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true } },
        tagihanWarga: { include: { tagihan: { select: { judul: true } } } },
      },
    }),
    prisma.pengeluaranKas.findMany({
      where: { tanggal: { gte: awal, lt: akhir } },
      orderBy: { tanggal: "desc" },
      take: 100,
      include: { dicatatOleh: { select: { name: true } } },
    }),
  ]);

  const totalMasuk = masuk._sum.nominal ?? 0;
  const totalKeluar = keluar._sum.nominal ?? 0;

  return NextResponse.json({
    bulan,
    totalMasuk,
    totalKeluar,
    saldo: totalMasuk - totalKeluar,
    jumlahTransaksiMasuk: masuk._count,
    jumlahTransaksiKeluar: keluar._count,
    daftarMasuk,
    daftarKeluar,
  });
}

const keluarSchema = z.object({
  judul: z.string().min(3).max(150),
  kategori: z.string().max(40).default("OPERASIONAL"),
  nominal: z.number().int().min(1000).max(1_000_000_000),
  tanggal: z.string().datetime().optional(),
  keterangan: z.string().max(1000).optional(),
});

// POST /api/kas/rekap — catat pengeluaran kas (Bendahara/Pengurus)
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id: string; role?: string } | undefined;
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!bolehLihat(user.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = keluarSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const item = await prisma.pengeluaranKas.create({
    data: {
      judul: parsed.data.judul,
      kategori: parsed.data.kategori,
      nominal: parsed.data.nominal,
      tanggal: parsed.data.tanggal ? new Date(parsed.data.tanggal) : new Date(),
      keterangan: parsed.data.keterangan,
      dicatatOlehId: user.id,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: item.id });
}
