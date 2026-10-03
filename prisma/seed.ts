import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users = [
    { name: "Ketua RT", email: "pengurus@rtku.local", password: "Pengurus123", role: Role.PENGURUS, phone: "081234567890", blok: "A", nomorRumah: "1" },
    { name: "Bendahara RT", email: "bendahara@rtku.local", password: "Bendahara123", role: Role.BENDAHARA, phone: "081234567891", blok: "A", nomorRumah: "2" },
    { name: "Sekretaris RT", email: "sekretaris@rtku.local", password: "Sekretaris123", role: Role.SEKRETARIS, phone: "081234567892", blok: "A", nomorRumah: "3" },
    { name: "Budi Santoso", email: "warga@rtku.local", password: "Warga123", role: Role.WARGA, phone: "081234567893", blok: "B", nomorRumah: "12" },
    { name: "Siti Aminah", email: "warga2@rtku.local", password: "Warga123", role: Role.WARGA, phone: "081234567894", blok: "B", nomorRumah: "14" },
  ];

  const created: Record<string, string> = {};
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, role: u.role, isActive: true },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        phone: u.phone,
        blok: u.blok,
        nomorRumah: u.nomorRumah,
      },
    });
    created[u.email] = user.id;
    console.log(`user: ${u.email} (${u.role})`);
  }

  // Tagihan contoh: Iuran bulan berjalan
  const now = new Date();
  const periode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const jatuhTempo = new Date(now.getFullYear(), now.getMonth() + 1, 10, 23, 59, 59);

  const existing = await prisma.tagihan.findFirst({ where: { periode, jenis: "IURAN_BULANAN" } });
  if (!existing) {
    const tagihan = await prisma.tagihan.create({
      data: {
        judul: `Iuran Bulanan ${periode}`,
        periode,
        jenis: "IURAN_BULANAN",
        nominal: 50000,
        jatuhTempo,
        keterangan: "Iuran keamanan & kebersihan perumahan.",
        dibuatOlehId: created["bendahara@rtku.local"],
      },
    });
    for (const email of ["warga@rtku.local", "warga2@rtku.local"]) {
      await prisma.tagihanWarga.create({
        data: { tagihanId: tagihan.id, userId: created[email], nominal: 50000 },
      });
    }
    console.log(`tagihan: ${tagihan.judul}`);
  }

  // Pengumuman contoh
  const annCount = await prisma.pengumuman.count();
  if (annCount === 0) {
    await prisma.pengumuman.create({
      data: {
        judul: "Selamat datang di RTKu",
        isi: "Aplikasi resmi RT/R perumahan. Bayar iuran via QRIS/transfer, pantau CCTV lingkungan, dan baca pengumuman terbaru di sini.",
        kategori: "UMUM",
        dibuatOlehId: created["sekretaris@rtku.local"],
      },
    });
    console.log("pengumuman: Selamat datang di RTKu");
  }

  // Kamera CCTV contoh (stream demo publik; ganti dengan URL HLS dari NVR/DVR)
  const camCount = await prisma.kameraCctv.count();
  if (camCount === 0) {
    await prisma.kameraCctv.createMany({
      data: [
        {
          nama: "Gerbang Utama",
          lokasi: "Pintu masuk perumahan",
          streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          urutan: 1,
        },
        {
          nama: "Taman Blok B",
          lokasi: "Area taman",
          streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          urutan: 2,
        },
      ],
    });
    console.log("kamera: 2 kamera contoh");
  }

  console.log("\nSeed selesai. Akun demo:");
  console.log("  pengurus@rtku.local / Pengurus123   (Pengurus)");
  console.log("  bendahara@rtku.local / Bendahara123 (Bendahara)");
  console.log("  sekretaris@rtku.local / Sekretaris123 (Sekretaris)");
  console.log("  warga@rtku.local / Warga123         (Warga)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
