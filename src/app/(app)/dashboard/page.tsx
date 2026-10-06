import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rupiah, formatTanggalWita, formatTanggalWaktuWita } from "@/lib/format";
import { StatCard, Card, badgeStatusBayar, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user as { id: string; name: string; role: string };
  const role = user.role;

  if (role === "WARGA" || role === "SEKRETARIS") {
    const tagihan = await prisma.tagihanWarga.findMany({
      where: { userId: user.id, status: { in: ["BELUM_BAYAR", "MENUNGGU_VALIDASI"] } },
      include: { tagihan: true },
      orderBy: { tagihan: { jatuhTempo: "asc" } },
      take: 5,
    });
    const totalBelum = tagihan.reduce((s, t) => s + t.nominal, 0);
    const pengumuman = await prisma.pengumuman.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    return (
      <div className="anim-fade-up space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Halo, {user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-500">Ringkasan iuran dan informasi perumahan Anda.</p>
        </div>

        {tagihan.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {tagihan.length} tagihan belum lunas
                </p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                  {rupiah(totalBelum)}
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  Jatuh tempo terdekat {formatTanggalWita(tagihan[0].tagihan.jatuhTempo)}
                </p>
              </div>
              <Link
                href="/iuran"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/25 transition hover:bg-emerald-800 active:scale-[0.98]"
              >
                Bayar Sekarang
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <p className="text-3xl">🎉</p>
            <p className="mt-2 font-bold text-slate-900">Semua tagihan lunas</p>
            <p className="text-sm text-slate-500">Tidak ada tagihan yang perlu dibayar.</p>
          </div>
        )}

        {tagihan.length > 0 && (
          <Card
            title="Tagihan Perlu Dibayar"
            action={<Link href="/iuran" className="text-sm font-semibold text-emerald-700 hover:underline">Lihat semua →</Link>}
          >
            <ul className="divide-y divide-slate-100">
              {tagihan.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-slate-800">{t.tagihan.judul}</p>
                    <p className="text-xs text-slate-500">Jatuh tempo {formatTanggalWita(t.tagihan.jatuhTempo)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {badgeStatusBayar(t.status)}
                    <span className="font-bold text-slate-900">{rupiah(t.nominal)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card
          title="Pengumuman Terbaru"
          action={<Link href="/pengumuman" className="text-sm font-semibold text-emerald-700 hover:underline">Lihat semua →</Link>}
        >
          {pengumuman.length === 0 ? (
            <Empty icon="📭" title="Belum ada pengumuman" />
          ) : (
            <ul className="space-y-3">
              {pengumuman.map((p) => (
                <li key={p.id}>
                  <Link href={`/pengumuman/${p.id}`} className="block rounded-xl border border-slate-100 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/50">
                    <p className="font-semibold text-slate-800">{p.judul}</p>
                    <p className="text-xs text-slate-500">{formatTanggalWita(p.createdAt)} · {p.kategori}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    );
  }

  // SECURITY — ringkasan shift hari ini
  if (role === "SECURITY") {
    const { awalHariWita } = await import("@/lib/absensi");
    const hariIni = await prisma.absensi.findUnique({
      where: { userId_tanggal: { userId: user.id, tanggal: awalHariWita() } },
    });
    const pengumuman = await prisma.pengumuman.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    return (
      <div className="anim-fade-up space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Halo, {user.name?.split(" ")[0]} 🛡️
          </h1>
          <p className="text-sm text-slate-500">Shift jaga hari ini.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Jam Masuk"
            value={hariIni?.jamMasuk ? formatTanggalWaktuWita(hariIni.jamMasuk).split(", ")[1] ?? "—" : "Belum absen"}
            sub="hari ini"
            icon="🟢"
            tone="emerald"
          />
          <StatCard
            label="Jam Pulang"
            value={hariIni?.jamPulang ? formatTanggalWaktuWita(hariIni.jamPulang).split(", ")[1] ?? "—" : "—"}
            sub="hari ini"
            icon="🔴"
            tone="sky"
          />
        </div>

        <Card
          title="Absensi Shift"
          action={<Link href="/absensi" className="text-sm font-semibold text-emerald-700 hover:underline">Buka absensi →</Link>}
        >
          <p className="text-sm text-slate-600">
            {!hariIni?.jamMasuk
              ? "Anda belum absen masuk hari ini. Ketuk tombol Absen Masuk dengan selfie wajah di area perumahan."
              : hariIni.jamPulang
                ? "Shift hari ini selesai. Terima kasih! 🙏"
                : "Anda sedang bertugas. Jangan lupa absen pulang saat shift berakhir."}
          </p>
        </Card>

        <Card
          title="Pengumuman Terbaru"
          action={<Link href="/pengumuman" className="text-sm font-semibold text-emerald-700 hover:underline">Lihat semua →</Link>}
        >
          {pengumuman.length === 0 ? (
            <Empty icon="📭" title="Belum ada pengumuman" />
          ) : (
            <ul className="space-y-3">
              {pengumuman.map((p) => (
                <li key={p.id}>
                  <Link href={`/pengumuman/${p.id}`} className="block rounded-xl border border-slate-100 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/50">
                    <p className="font-semibold text-slate-800">{p.judul}</p>
                    <p className="text-xs text-slate-500">{formatTanggalWita(p.createdAt)} · {p.kategori}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    );
  }

  // PENGURUS & BENDAHARA
  const now = new Date();
  const awalBulan = new Date(now.getFullYear(), now.getMonth(), 1);
  const [kasMasuk, menungguValidasi, totalWarga, tagihanAktif] = await Promise.all([
    prisma.pembayaran.aggregate({
      where: { status: "PAID", paidAt: { gte: awalBulan } },
      _sum: { nominal: true },
    }),
    prisma.pembayaran.count({ where: { status: "MENUNGGU_VALIDASI" } }),
    prisma.user.count({ where: { role: "WARGA", isActive: true } }),
    prisma.tagihanWarga.count({ where: { status: "BELUM_BAYAR" } }),
  ]);
  const pengeluaran = await prisma.pengeluaranKas.aggregate({
    where: { tanggal: { gte: awalBulan } },
    _sum: { nominal: true },
  });
  const pembayaranTerbaru = await prisma.pembayaran.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: { select: { name: true } }, tagihanWarga: { include: { tagihan: true } } },
  });

  return (
    <div className="anim-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Dashboard {role === "BENDAHARA" ? "Bendahara" : "Pengurus"}</h1>
        <p className="text-sm text-slate-500">Kelola iuran, kas, dan validasi pembayaran warga.</p>
      </div>

      {menungguValidasi > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-800">Perlu tindakan Anda</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {menungguValidasi} <span className="text-lg font-bold">pembayaran menunggu validasi</span>
              </p>
              <p className="mt-1 text-xs text-amber-700">Bukti transfer manual dari warga, belum diperiksa.</p>
            </div>
            <Link
              href="/validasi"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/25 transition hover:bg-emerald-800 active:scale-[0.98]"
            >
              Validasi Sekarang
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <p className="font-bold text-slate-900">✅ Tidak ada antrean validasi</p>
          <p className="text-sm text-slate-500">Semua pembayaran warga sudah diproses.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Kas Masuk Bulan Ini" value={rupiah(kasMasuk._sum.nominal ?? 0)} icon="💰" tone="emerald" />
        <StatCard label="Pengeluaran Bulan Ini" value={rupiah(pengeluaran._sum.nominal ?? 0)} icon="🧾" tone="red" />
        <StatCard label="Total Warga Aktif" value={String(totalWarga)} sub={`${tagihanAktif} tagihan belum bayar`} icon="👥" tone="sky" />
      </div>

      <Card
        title="Pembayaran Terbaru"
        action={<Link href="/validasi" className="text-sm font-semibold text-emerald-700 hover:underline">Validasi →</Link>}
      >
        {pembayaranTerbaru.length === 0 ? (
          <Empty icon="📭" title="Belum ada pembayaran" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {pembayaranTerbaru.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-slate-800">{p.user.name}</p>
                  <p className="text-xs text-slate-500">{p.tagihanWarga.tagihan.judul}</p>
                </div>
                <div className="flex items-center gap-3">
                  {badgeStatusBayar(p.status)}
                  <span className="font-bold text-slate-900">{rupiah(p.nominal)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
