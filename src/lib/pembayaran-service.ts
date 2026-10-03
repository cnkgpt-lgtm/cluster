import { prisma } from "./db";
import { assertTransition, statusTagihanDariPembayaran, type StatusPembayaran } from "./pembayaran";
import { kirimNotifikasi, kirimNotifikasiKeRole } from "./notifikasi";
import { rupiah, labelMetode } from "./format";

// Terapkan hasil pembayaran ke database + efek samping (notifikasi).
// Dipakai oleh webhook Midtrans dan simulator mode mock.
export async function prosesHasilPembayaran(
  pembayaranId: string,
  statusBaru: StatusPembayaran,
): Promise<{ ok: boolean; skipped?: boolean }> {
  const pembayaran = await prisma.pembayaran.findUnique({
    where: { id: pembayaranId },
    include: {
      user: { select: { id: true, name: true } },
      tagihanWarga: { include: { tagihan: { select: { judul: true } } } },
    },
  });
  if (!pembayaran) throw new Error("ORDER_NOT_FOUND");

  const dari = pembayaran.status as StatusPembayaran;
  if (dari === statusBaru) return { ok: true, skipped: true };
  assertTransition(dari, statusBaru);

  const data: Record<string, unknown> = { status: statusBaru };
  if (statusBaru === "PAID") data.paidAt = new Date();

  await prisma.$transaction([
    prisma.pembayaran.update({ where: { id: pembayaranId }, data }),
    prisma.tagihanWarga.update({
      where: { id: pembayaran.tagihanWargaId },
      data: { status: statusTagihanDariPembayaran(statusBaru) },
    }),
  ]);

  const judul = pembayaran.tagihanWarga.tagihan.judul;
  const nominal = rupiah(pembayaran.nominal);

  if (statusBaru === "PAID") {
    await kirimNotifikasi({
      userId: pembayaran.userId,
      judul: "Pembayaran lunas ✅",
      pesan: `${judul} sebesar ${nominal} telah lunas via ${labelMetode(pembayaran.metode)}. Terima kasih!`,
      tipe: "PEMBAYARAN",
      linkUrl: "/iuran",
    });
    await kirimNotifikasiKeRole("BENDAHARA", {
      judul: "Pembayaran masuk",
      pesan: `${pembayaran.user.name} melunasi ${judul} (${nominal}).`,
      tipe: "PEMBAYARAN",
      linkUrl: "/validasi",
    });
  } else if (statusBaru === "MENUNGGU_VALIDASI") {
    await kirimNotifikasiKeRole("BENDAHARA", {
      judul: "Bukti transfer perlu divalidasi",
      pesan: `${pembayaran.user.name} mengunggah bukti ${judul} (${nominal}).`,
      tipe: "VALIDASI",
      linkUrl: "/validasi",
    });
  } else if (statusBaru === "DITOLAK") {
    await kirimNotifikasi({
      userId: pembayaran.userId,
      judul: "Bukti transfer ditolak",
      pesan: `Bukti pembayaran ${judul} (${nominal}) ditolak bendahara. Silakan unggah ulang bukti yang valid.`,
      tipe: "VALIDASI",
      linkUrl: "/iuran",
    });
  }

  return { ok: true };
}
