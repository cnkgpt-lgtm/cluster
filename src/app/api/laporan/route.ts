import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const BOLEH = ["BENDAHARA", "PENGURUS", "SEKRETARIS"] as const;
const WITA = "Asia/Makassar";
const SEHARI = 86_400_000;

function hariIniWita(): string {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: WITA, year: "numeric", month: "2-digit", day: "2-digit",
  });
  return f.format(new Date()); // YYYY-MM-DD
}

// Hitung rentang periode dalam UTC dari tanggal acuan (diinterpretasi sebagai tanggal WITA).
function rentang(tipe: string, tanggalRef: string): { dari: Date; sampai: Date; label: string; periode: string } {
  const m = tanggalRef.match(/^(\d{4})-(\d{2})-(\d{2})$/) ? tanggalRef : hariIniWita();
  const [y, mo, d] = m.split("-").map(Number);
  const awalHari = (yy: number, mm: number, dd: number) =>
    new Date(Date.UTC(yy, mm - 1, dd, -8, 0, 0, 0)); // 00:00 WITA

  const fmtHari = (dt: Date) =>
    new Intl.DateTimeFormat("id-ID", { timeZone: WITA, day: "numeric", month: "long", year: "numeric" }).format(dt);
  const fmtBulan = (dt: Date) =>
    new Intl.DateTimeFormat("id-ID", { timeZone: WITA, month: "long", year: "numeric" }).format(dt);

  let dari: Date, sampai: Date, label: string, periode: string;
  if (tipe === "mingguan") {
    const ref = Date.UTC(y, mo - 1, d);
    const offsetSenin = (new Date(ref).getUTCDay() + 6) % 7; // Senin = 0
    const senin = new Date(ref - offsetSenin * SEHARI);
    dari = awalHari(senin.getUTCFullYear(), senin.getUTCMonth() + 1, senin.getUTCDate());
    sampai = new Date(dari.getTime() + 7 * SEHARI);
    label = `${fmtHari(dari)} – ${fmtHari(new Date(sampai.getTime() - 1))}`;
    periode = `${y}-${String(mo).padStart(2, "0")}`;
  } else if (tipe === "bulanan") {
    dari = awalHari(y, mo, 1);
    const blnDepan = mo === 12 ? 1 : mo + 1;
    const thnDepan = mo === 12 ? y + 1 : y;
    sampai = awalHari(thnDepan, blnDepan, 1);
    label = fmtBulan(dari);
    periode = `${y}-${String(mo).padStart(2, "0")}`;
  } else {
    dari = awalHari(y, mo, d);
    sampai = new Date(dari.getTime() + SEHARI);
    label = fmtHari(dari);
    periode = `${y}-${String(mo).padStart(2, "0")}`;
  }
  return { dari, sampai, label, periode };
}

// GET /api/laporan?tipe=harian|mingguan|bulanan&tanggal=YYYY-MM-DD
// Ringkasan arus kas + rincian pemasukan/pengeluaran + tunggakan (bulanan).
export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!(BOLEH as readonly string[]).includes(role ?? "")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const tipe = ["harian", "mingguan", "bulanan"].includes(searchParams.get("tipe") ?? "")
    ? (searchParams.get("tipe") as string)
    : "harian";
  const { dari, sampai, label, periode } = rentang(tipe, searchParams.get("tanggal") ?? "");

  // Pemasukan: pembayaran PAID pada rentang (pakai paidAt; fallback createdAt bila null)
  const bayar = await prisma.pembayaran.findMany({
    where: {
      status: "PAID",
      OR: [
        { paidAt: { gte: dari, lt: sampai } },
        { paidAt: null, createdAt: { gte: dari, lt: sampai } },
      ],
    },
    include: {
      user: { select: { name: true } },
      tagihanWarga: { include: { tagihan: { select: { judul: true } } } },
    },
    orderBy: { paidAt: "asc" },
  });

  const keluar = await prisma.pengeluaranKas.findMany({
    where: { tanggal: { gte: dari, lt: sampai } },
    include: { dicatatOleh: { select: { name: true } } },
    orderBy: { tanggal: "asc" },
  });

  const totalMasuk = bayar.reduce((s, p) => s + p.nominal, 0);
  const totalKeluar = keluar.reduce((s, p) => s + p.nominal, 0);

  const perMetode: Record<string, number> = {};
  for (const p of bayar) perMetode[p.metode] = (perMetode[p.metode] ?? 0) + p.nominal;

  // Tunggakan: hanya untuk laporan bulanan (tagihan periode berjalan yg belum lunas)
  let tunggakan: unknown[] = [];
  if (tipe === "bulanan") {
    const t = await prisma.tagihanWarga.findMany({
      where: {
        status: { in: ["BELUM_BAYAR", "MENUNGGU_VALIDASI"] },
        tagihan: { periode },
      },
      include: {
        user: { select: { name: true, blok: true, nomorRumah: true } },
        tagihan: { select: { judul: true } },
      },
      orderBy: [{ user: { name: "asc" } }],
    });
    tunggakan = t.map((x) => ({
      warga: x.user.name,
      blok: x.user.blok,
      nomorRumah: x.user.nomorRumah,
      tagihan: x.tagihan.judul,
      nominal: x.nominal,
      status: x.status,
    }));
  }

  return NextResponse.json({
    tipe,
    label,
    periode,
    ringkasan: {
      pemasukan: totalMasuk,
      pengeluaran: totalKeluar,
      saldo: totalMasuk - totalKeluar,
      jumlahPemasukan: bayar.length,
      jumlahPengeluaran: keluar.length,
      jumlahTunggakan: (tunggakan as unknown[]).length,
    },
    perMetode,
    pemasukan: bayar.map((p) => ({
      id: p.id,
      waktu: (p.paidAt ?? p.createdAt).toISOString(),
      warga: p.user.name,
      tagihan: p.tagihanWarga.tagihan.judul,
      metode: p.metode,
      nominal: p.nominal,
    })),
    pengeluaran: keluar.map((p) => ({
      id: p.id,
      waktu: p.tanggal.toISOString(),
      judul: p.judul,
      kategori: p.kategori,
      keterangan: p.keterangan,
      dicatatOleh: p.dicatatOleh.name,
      nominal: p.nominal,
    })),
    tunggakan,
  });
}
