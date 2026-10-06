"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Empty, Badge, StatCard } from "@/components/ui";
import { rupiah, formatTanggalWaktuWita, labelMetode } from "@/lib/format";

type Tipe = "harian" | "mingguan" | "bulanan";

const TABS: { id: Tipe; label: string }[] = [
  { id: "harian", label: "📅 Harian" },
  { id: "mingguan", label: "🗓️ Mingguan" },
  { id: "bulanan", label: "📊 Bulanan" },
];

interface ItemMasuk { id: string; waktu: string; warga: string; tagihan: string; metode: string; nominal: number }
interface ItemKeluar { id: string; waktu: string; judul: string; kategori: string; keterangan: string | null; dicatatOleh: string; nominal: number }
interface ItemTunggakan { warga: string; blok: string | null; nomorRumah: string | null; tagihan: string; nominal: number; status: string }

interface DataLaporan {
  tipe: Tipe;
  label: string;
  ringkasan: { pemasukan: number; pengeluaran: number; saldo: number; jumlahPemasukan: number; jumlahPengeluaran: number; jumlahTunggakan: number };
  perMetode: Record<string, number>;
  pemasukan: ItemMasuk[];
  pengeluaran: ItemKeluar[];
  tunggakan: ItemTunggakan[];
}

function hariIni(): string {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit" });
  return f.format(new Date());
}

function geserTanggal(iso: string, tipe: Tipe, arah: 1 | -1): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (tipe === "harian") dt.setUTCDate(dt.getUTCDate() + arah);
  else if (tipe === "mingguan") dt.setUTCDate(dt.getUTCDate() + 7 * arah);
  else dt.setUTCMonth(dt.getUTCMonth() + arah);
  return dt.toISOString().slice(0, 10);
}

export default function LaporanPage() {
  const [tipe, setTipe] = useState<Tipe>("harian");
  const [tanggal, setTanggal] = useState(hariIni());
  const [data, setData] = useState<DataLaporan | null>(null);
  const [loading, setLoading] = useState(true);
  const [ditolak, setDitolak] = useState(false);

  const muat = useCallback(() => {
    setLoading(true);
    fetch(`/api/laporan?tipe=${tipe}&tanggal=${tanggal}`)
      .then((r) => {
        if (r.status === 403) setDitolak(true);
        return r.ok ? r.json() : null;
      })
      .then((d) => d && setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tipe, tanggal]);

  useEffect(() => { muat(); }, [muat]);

  const gantiTipe = (t: Tipe) => { setTipe(t); setTanggal(hariIni()); };

  if (ditolak) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card title="Laporan">
          <p className="text-sm text-slate-600">Halaman ini hanya untuk Bendahara, Pengurus, dan Sekretaris.</p>
        </Card>
      </div>
    );
  }

  const r = data?.ringkasan;

  return (
    <div className="anim-fade-up mx-auto max-w-4xl space-y-4">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #laporan-cetak, #laporan-cetak * { visibility: visible; }
          #laporan-cetak { position: absolute; left: 0; top: 0; width: 100%; margin: 0; }
        }
      `}</style>

      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">📊 Laporan Keuangan</h1>
          <p className="text-sm text-slate-500">Arus kas iuran & pengeluaran RT.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
        >
          🖨️ Cetak
        </button>
      </div>

      {/* Tab tipe */}
      <div className="no-print flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => gantiTipe(t.id)}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
              tipe === t.id
                ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/25"
                : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Navigasi periode */}
      <div className="no-print flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
        <button
          onClick={() => setTanggal((t) => geserTanggal(t, tipe, -1))}
          className="rounded-xl px-3 py-1.5 text-lg font-bold text-slate-500 hover:bg-slate-100"
          aria-label="Periode sebelumnya"
        >
          ‹
        </button>
        <button onClick={() => setTanggal(hariIni())} className="text-sm font-bold text-slate-800">
          {loading ? "Memuat…" : (data?.label ?? "")}
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
            hari ini
          </span>
        </button>
        <button
          onClick={() => setTanggal((t) => geserTanggal(t, tipe, 1))}
          className="rounded-xl px-3 py-1.5 text-lg font-bold text-slate-500 hover:bg-slate-100"
          aria-label="Periode berikutnya"
        >
          ›
        </button>
      </div>

      <div id="laporan-cetak" className="space-y-4">
        <div className="print-only hidden text-center print:block">
          <h2 className="text-lg font-extrabold">LAPORAN KEUANGAN RT</h2>
          <p className="text-sm text-slate-600">{data?.label} • {TABS.find((t) => t.id === tipe)?.label.replace(/^[^\s]+\s/, "")}</p>
        </div>

        {/* Ringkasan */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Pemasukan" value={rupiah(r?.pemasukan ?? 0)} sub={`${r?.jumlahPemasukan ?? 0} transaksi`} icon="💰" tone="emerald" />
          <StatCard label="Pengeluaran" value={rupiah(r?.pengeluaran ?? 0)} sub={`${r?.jumlahPengeluaran ?? 0} transaksi`} icon="💸" tone="red" />
          <StatCard label="Saldo" value={rupiah(r?.saldo ?? 0)} sub="masuk − keluar" icon="📊" tone="sky" />
        </div>

        {/* Rincian pemasukan */}
        <Card title={`💰 Pemasukan (${data?.pemasukan.length ?? 0})`}>
          {data && Object.keys(data.perMetode).length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {Object.entries(data.perMetode).map(([m, n]) => (
                <Badge key={m} tone="green">{labelMetode(m)}: {rupiah(n)}</Badge>
              ))}
            </div>
          )}
          {!data?.pemasukan.length ? (
            <p className="text-sm text-slate-400">Tidak ada pemasukan pada periode ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                    <th className="py-2 pr-2">Waktu</th>
                    <th className="py-2 pr-2">Warga</th>
                    <th className="py-2 pr-2">Tagihan</th>
                    <th className="py-2 pr-2">Metode</th>
                    <th className="py-2 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pemasukan.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50">
                      <td className="py-2 pr-2 text-xs text-slate-500">{formatTanggalWaktuWita(p.waktu)}</td>
                      <td className="py-2 pr-2 font-semibold">{p.warga}</td>
                      <td className="py-2 pr-2 text-xs text-slate-500">{p.tagihan}</td>
                      <td className="py-2 pr-2"><Badge tone="sky">{labelMetode(p.metode)}</Badge></td>
                      <td className="py-2 text-right font-bold text-emerald-700">+{rupiah(p.nominal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Rincian pengeluaran */}
        <Card title={`💸 Pengeluaran (${data?.pengeluaran.length ?? 0})`}>
          {!data?.pengeluaran.length ? (
            <p className="text-sm text-slate-400">Tidak ada pengeluaran pada periode ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                    <th className="py-2 pr-2">Waktu</th>
                    <th className="py-2 pr-2">Keterangan</th>
                    <th className="py-2 pr-2">Kategori</th>
                    <th className="py-2 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pengeluaran.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50">
                      <td className="py-2 pr-2 text-xs text-slate-500">{formatTanggalWaktuWita(p.waktu)}</td>
                      <td className="py-2 pr-2">
                        <p className="font-semibold">{p.judul}</p>
                        {p.keterangan && <p className="text-xs text-slate-400">{p.keterangan}</p>}
                      </td>
                      <td className="py-2 pr-2"><Badge tone="amber">{p.kategori}</Badge></td>
                      <td className="py-2 text-right font-bold text-red-600">−{rupiah(p.nominal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Tunggakan (bulanan) */}
        {tipe === "bulanan" && (
          <Card title={`⚠️ Tunggakan (${data?.tunggakan.length ?? 0})`}>
            {!data?.tunggakan.length ? (
              <p className="text-sm text-slate-400">Tidak ada tunggakan. Semua sudah lunas. 🎉</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                      <th className="py-2 pr-2">Warga</th>
                      <th className="py-2 pr-2">Tagihan</th>
                      <th className="py-2 pr-2">Status</th>
                      <th className="py-2 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tunggakan.map((t, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-2 pr-2 font-semibold">
                          {t.warga}
                          <span className="block text-xs font-normal text-slate-400">
                            {[t.blok ? `Blok ${t.blok}` : null, t.nomorRumah ? `No. ${t.nomorRumah}` : null].filter(Boolean).join(" ") || "—"}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-xs text-slate-500">{t.tagihan}</td>
                        <td className="py-2 pr-2">
                          <Badge tone={t.status === "MENUNGGU_VALIDASI" ? "amber" : "red"}>
                            {t.status === "MENUNGGU_VALIDASI" ? "Menunggu validasi" : "Belum bayar"}
                          </Badge>
                        </td>
                        <td className="py-2 text-right font-bold">{rupiah(t.nominal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {loading && !data && <Empty icon="📊" title="Memuat laporan…" sub="Mengambil data keuangan." />}
      </div>
    </div>
  );
}
