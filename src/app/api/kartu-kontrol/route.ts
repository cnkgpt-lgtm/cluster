import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const BOLEH = ["BENDAHARA", "PENGURUS", "SEKRETARIS"] as const;

function bolehLihat(role: string | undefined, userIdDiminta: string | null, userIdSendiri: string) {
  // Bendahara/Pengurus/Sekretaris boleh lihat semua kartu warga.
  if (!!role && (BOLEH as readonly string[]).includes(role)) return true;
  // Warga hanya boleh lihat kartu miliknya sendiri.
  return role === "WARGA" && !!userIdDiminta && userIdDiminta === userIdSendiri;
}

// GET /api/kartu-kontrol — daftar warga + ringkasan pembayaran (Bendahara/Pengurus/Sekretaris)
// GET /api/kartu-kontrol?userId=xxx — kartu kontrol 1 warga: tiap tagihan + tanggal & bukti bayar
export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id: string; role?: string } | undefined;
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  // Daftar semua warga: khusus Bendahara/Pengurus/Sekretaris.
  if (!userId) {
    if (!(BOLEH as readonly string[]).includes(user.role ?? "")) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  } else if (!bolehLihat(user.role, userId, user.id)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // ---------- Detail 1 warga ----------
  if (userId) {
    const warga = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, blok: true, nomorRumah: true, phone: true, alamat: true },
    });
    if (!warga || warga.role !== "WARGA") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const tagihan = await prisma.tagihanWarga.findMany({
      where: { userId },
      include: {
        tagihan: { select: { judul: true, periode: true, jenis: true, jatuhTempo: true } },
        pembayaran: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true, metode: true, status: true, nominal: true,
            buktiUrl: true, paidAt: true, createdAt: true, validatedAt: true,
            validatedBy: { select: { name: true } },
          },
        },
      },
      orderBy: { tagihan: { jatuhTempo: "asc" } },
    });

    const items = tagihan.map((tw) => {
      const bayar = tw.pembayaran[0] ?? null;
      return {
        tagihanWargaId: tw.id,
        judul: tw.tagihan.judul,
        periode: tw.tagihan.periode,
        jenis: tw.tagihan.jenis,
        jatuhTempo: tw.tagihan.jatuhTempo,
        nominal: tw.nominal,
        status: tw.status,
        pembayaran: bayar
          ? {
              id: bayar.id,
              metode: bayar.metode,
              status: bayar.status,
              nominal: bayar.nominal,
              buktiUrl: bayar.buktiUrl,
              // tanggal bayar: paidAt (lunas) atau waktu transaksi/upload
              tanggalBayar: (bayar.paidAt ?? bayar.createdAt).toISOString(),
              validatedAt: bayar.validatedAt?.toISOString() ?? null,
              penerima: bayar.validatedBy?.name ?? (bayar.metode === "QRIS" ? "Otomatis" : null),
            }
          : null,
      };
    });

    // Tim pengelola untuk blok tanda tangan kartu.
    const pengelola = await prisma.user.findMany({
      where: { role: { in: ["PENGURUS", "SEKRETARIS", "BENDAHARA"] }, isActive: true },
      select: { name: true, role: true },
      orderBy: { createdAt: "asc" },
      take: 10,
    });
    const namaPeran = (r: string) => pengelola.find((p) => p.role === r)?.name ?? null;

    const ringkasan = {
      totalTagihan: items.length,
      lunas: items.filter((i) => i.status === "LUNAS").length,
      menungguValidasi: items.filter((i) => i.status === "MENUNGGU_VALIDASI").length,
      belumBayar: items.filter((i) => i.status === "BELUM_BAYAR").length,
      totalNominal: items.reduce((s, i) => s + i.nominal, 0),
      totalTerbayar: items
        .filter((i) => i.status === "LUNAS")
        .reduce((s, i) => s + i.nominal, 0),
    };

    return NextResponse.json({
      warga,
      ringkasan,
      items,
      pengelola: {
        ketua: namaPeran("PENGURUS"),
        sekretaris: namaPeran("SEKRETARIS"),
        bendahara: namaPeran("BENDAHARA"),
      },
    });
  }

  // ---------- Daftar semua warga ----------
  const daftar = await prisma.user.findMany({
    where: { role: "WARGA", isActive: true },
    select: {
      id: true, name: true, blok: true, nomorRumah: true,
      tagihanWarga: { select: { status: true, nominal: true } },
    },
    orderBy: [{ blok: "asc" }, { nomorRumah: "asc" }, { name: "asc" }],
  });

  const warga = daftar.map((w) => {
    const t = w.tagihanWarga;
    return {
      id: w.id,
      name: w.name,
      blok: w.blok,
      nomorRumah: w.nomorRumah,
      totalTagihan: t.length,
      lunas: t.filter((x) => x.status === "LUNAS").length,
      menungguValidasi: t.filter((x) => x.status === "MENUNGGU_VALIDASI").length,
      belumBayar: t.filter((x) => x.status === "BELUM_BAYAR").length,
      totalNominal: t.reduce((s, x) => s + x.nominal, 0),
      totalTerbayar: t.filter((x) => x.status === "LUNAS").reduce((s, x) => s + x.nominal, 0),
    };
  });

  return NextResponse.json({ warga });
}
