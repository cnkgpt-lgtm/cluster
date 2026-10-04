import { prisma } from "./db";
import { rupiah } from "./format";

// Berikan semua tagihan aktif (belum jatuh tempo) ke seorang warga baru,
// agar tagihannya langsung muncul di halaman Iuran begitu akun dibuat.
// Tagihan yang sudah lewat jatuh tempo tidak diberikan (bukan periode huniannya).
// Idempoten berkat skipDuplicates — aman dipanggil ulang.
export async function berikanTagihanAktifKeUserBaru(userId: string): Promise<number> {
  const aktif = await prisma.tagihan.findMany({
    where: { jatuhTempo: { gte: new Date() } },
    select: { id: true, nominal: true, judul: true },
    orderBy: { jatuhTempo: "asc" },
  });
  if (aktif.length === 0) return 0;

  const hasil = await prisma.tagihanWarga.createMany({
    data: aktif.map((t) => ({ tagihanId: t.id, userId, nominal: t.nominal })),
    skipDuplicates: true,
  });

  // Satu notifikasi ringkasan (bukan per tagihan) agar tidak membanjiri.
  const total = aktif.reduce((s, t) => s + t.nominal, 0);
  await prisma.notifikasi.create({
    data: {
      userId,
      judul: "Tagihan aktif 🧾",
      pesan: `Akun Anda terdaftar dengan ${aktif.length} tagihan aktif total ${rupiah(total)}. Segera lakukan pembayaran sebelum jatuh tempo.`,
      tipe: "TAGIHAN",
      linkUrl: "/iuran",
    },
  });

  return hasil.count;
}
