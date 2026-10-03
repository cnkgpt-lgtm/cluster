import { prisma } from "./db";

export type TipeNotifikasi = "INFO" | "PEMBAYARAN" | "VALIDASI" | "PENGUMUMAN" | "TAGIHAN";

export async function kirimNotifikasi(opts: {
  userId: string;
  judul: string;
  pesan: string;
  tipe?: TipeNotifikasi;
  linkUrl?: string;
}) {
  return prisma.notifikasi.create({
    data: {
      userId: opts.userId,
      judul: opts.judul,
      pesan: opts.pesan,
      tipe: opts.tipe ?? "INFO",
      linkUrl: opts.linkUrl,
    },
  });
}

// Kirim ke semua pengguna dengan role tertentu (mis. semua BENDAHARA)
export async function kirimNotifikasiKeRole(
  role: "PENGURUS" | "BENDAHARA" | "SEKRETARIS" | "WARGA",
  opts: { judul: string; pesan: string; tipe?: TipeNotifikasi; linkUrl?: string },
) {
  const users = await prisma.user.findMany({
    where: { role, isActive: true },
    select: { id: true },
  });
  if (users.length === 0) return;
  await prisma.notifikasi.createMany({
    data: users.map((u) => ({
      userId: u.id,
      judul: opts.judul,
      pesan: opts.pesan,
      tipe: opts.tipe ?? "INFO",
      linkUrl: opts.linkUrl,
    })),
  });
}
