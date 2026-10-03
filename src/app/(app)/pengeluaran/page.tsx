import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rupiah, formatTanggalWita } from "@/lib/format";
import { StatCard, Card, Empty, Badge } from "@/components/ui";
import { FormPengeluaran, TombolHapusPengeluaran } from "@/components/pengeluaran";

export const dynamic = "force-dynamic";

const KATEGORI = ["SEMUA", "OPERASIONAL", "KEAMANAN", "KEBERSIHAN", "KEGIATAN", "DARURAT", "LAINNYA"];

const toneKategori: Record<string, "green" | "amber" | "red" | "sky" | "slate"> = {
  OPERASIONAL: "slate",
  KEAMANAN: "sky",
  KEBERSIHAN: "green",
  KEGIATAN: "amber",
  DARURAT: "red",
  LAINNYA: "slate",
};

const inputCls =
  "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";

export default async function PengeluaranPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string; kategori?: string; q?: string }>;
}) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "PENGURUS" && user?.role !== "BENDAHARA") redirect("/dashboard");

  const sp = await searchParams;
  const bulan =
    sp.bulan && /^\d{4}-\d{2}$/.test(sp.bulan) ? sp.bulan : new Date().toISOString().slice(0, 7);
  const kategori = sp.kategori && KATEGORI.includes(sp.kategori) ? sp.kategori : "SEMUA";
  const q = (sp.q ?? "").trim();

  const [thn, bln] = bulan.split("-").map(Number);
  const awal = new Date(thn, bln - 1, 1);
  const akhir = new Date(thn, bln, 1);

  const where = {
    tanggal: { gte: awal, lt: akhir },
    ...(kategori !== "SEMUA" ? { kategori } : {}),
    ...(q ? { judul: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [daftar, agg] = await Promise.all([
    prisma.pengeluaranKas.findMany({
      where,
      orderBy: { tanggal: "desc" },
      take: 200,
      include: { dicatatOleh: { select: { name: true } } },
    }),
    prisma.pengeluaranKas.aggregate({
      where,
      _sum: { nominal: true },
      _count: true,
    }),
  ]);

  const total = agg._sum.nominal ?? 0;
  const jumlah = agg._count;

  return (
    <div className="anim-stagger space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Pengeluaran</h1>
          <p className="text-sm text-slate-500">Catat dan kelola pengeluaran kas RT/R perumahan.</p>
        </div>
        <FormPengeluaran />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Total Pengeluaran" value={rupiah(total)} sub={`periode ${bulan}`} icon="💸" tone="red" />
        <StatCard label="Jumlah Transaksi" value={String(jumlah)} sub="catatan pengeluaran" icon="🧾" tone="amber" />
      </div>

      <Card title="Filter">
        <form method="get" className="grid gap-3 sm:grid-cols-[auto_auto_1fr_auto] sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Bulan</label>
            <input type="month" name="bulan" defaultValue={bulan} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Kategori</label>
            <select name="kategori" defaultValue={kategori} className={inputCls}>
              {KATEGORI.map((k) => (
                <option key={k} value={k}>
                  {k === "SEMUA" ? "Semua kategori" : k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Cari</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari judul pengeluaran..."
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 active:scale-[0.99]"
          >
            Terapkan
          </button>
        </form>
      </Card>

      <Card title={`Daftar Pengeluaran (${daftar.length})`}>
        {daftar.length === 0 ? (
          <Empty icon="📭" title="Belum ada pengeluaran" sub="Catat pengeluaran pertama dengan tombol di atas." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {daftar.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{p.judul}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge tone={toneKategori[p.kategori] ?? "slate"}>{p.kategori}</Badge>
                    <span>{formatTanggalWita(p.tanggal)}</span>
                    <span>· oleh {p.dicatatOleh.name}</span>
                  </p>
                  {p.keterangan && (
                    <p className="mt-0.5 truncate text-xs text-slate-400">{p.keterangan}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-sm font-bold text-red-600">−{rupiah(p.nominal)}</span>
                  <TombolHapusPengeluaran id={p.id} judul={p.judul} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
