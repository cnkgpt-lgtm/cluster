import { prisma } from "./db";
import { assertTransition, statusTagihanDariPembayaran, type StatusPembayaran } from "./pembayaran";
import { kirimNotifikasi, kirimNotifikasiKeRole } from "./notifikasi";
import { rupiah, labelMetode } from "./format";

// Aturan bisnis: hanya QRIS yang otomatis lunas (dikonfirmasi gateway).
// VA bank & transfer manual WAJIB divalidasi bendahara dulu.
export function perluValidasiBendahara(metode: string): boolean {
  return metode !== "QRIS";
}

// Terapkan hasil pembayaran ke database + efek samping (notifikasi).
// Dipakai oleh webhook Midtrans dan simulator mode mock.
// Jika gateway/simulator melaporkan PAID untuk metode yang wajib divalidasi
// (VA/transfer manual), status dialihkan ke MENUNGGU_VALIDASI — kecuali
// pemanggilnya adalah validasi bendahara itu sendiri (viaValidasiBendahara).
export async function prosesHasilPembayaran(
  pembayaranId: string,
  statusBaru: StatusPembayaran,
  opts?: { viaValidasiBendahara?: boolean },
): Promise<{ ok: boolean; skipped?: boolean; status?: StatusPembayaran }> {
  const pembayaran = await prisma.pembayaran.findUnique({
    where: { id: pembayaranId },
    include: {
      user: { select: { id: true, name: true } },
      tagihanWarga: { include: { tagihan: { select: { judul: true } } } },
    },
  });
  if (!pembayaran) throw new Error("ORDER_NOT_FOUND");

  const dari = pembayaran.status as StatusPembayaran;

  // VA/transfer manual yang dilaporkan lunas → wajib validasi bendahara dulu.
  let statusEfektif = statusBaru;
  if (
    statusBaru === "PAID" &&
    !opts?.viaValidasiBendahara &&
    perluValidasiBendahara(pembayaran.metode)
  ) {
    statusEfektif = "MENUNGGU_VALIDASI";
  }

  if (dari === statusEfektif) return { ok: true, skipped: true };
  assertTransition(dari, statusEfektif);

  const data: Record<string, unknown> = { status: statusEfektif };
  if (statusEfektif === "PAID") data.paidAt = new Date();

  await prisma.$transaction([
    prisma.pembayaran.update({ where: { id: pembayaranId }, data }),
    prisma.tagihanWarga.update({
      where: { id: pembayaran.tagihanWargaId },
      data: { status: statusTagihanDariPembayaran(statusEfektif) },
    }),
  ]);

  const judul = pembayaran.tagihanWarga.tagihan.judul;
  const nominal = rupiah(pembayaran.nominal);

  if (statusEfektif === "PAID") {
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
  } else if (statusEfektif === "MENUNGGU_VALIDASI") {
    const viaVA = pembayaran.metode.startsWith("VA_");
    await kirimNotifikasiKeRole("BENDAHARA", {
      judul: viaVA ? "Pembayaran VA perlu divalidasi" : "Bukti transfer perlu divalidasi",
      pesan: viaVA
        ? `${pembayaran.user.name} membayar ${judul} (${nominal}) via ${labelMetode(pembayaran.metode)}. Cek mutasi rekening lalu validasi.`
        : `${pembayaran.user.name} mengunggah bukti ${judul} (${nominal}).`,
      tipe: "VALIDASI",
      linkUrl: "/validasi",
    });
    // Beri tahu warga bahwa pembayarannya menunggu validasi bendahara.
    await kirimNotifikasi({
      userId: pembayaran.userId,
      judul: "Menunggu validasi bendahara ⏳",
      pesan: `Pembayaran ${judul} (${nominal}) via ${labelMetode(pembayaran.metode)} sedang diverifikasi bendahara.`,
      tipe: "VALIDASI",
      linkUrl: "/iuran",
    });
  } else if (statusEfektif === "DITOLAK") {
    await kirimNotifikasi({
      userId: pembayaran.userId,
      judul: "Bukti transfer ditolak",
      pesan: `Bukti pembayaran ${judul} (${nominal}) ditolak bendahara. Silakan unggah ulang bukti yang valid.`,
      tipe: "VALIDASI",
      linkUrl: "/iuran",
    });
  }

  return { ok: true, status: statusEfektif };
}
