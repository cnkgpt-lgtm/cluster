"use client";

import { useEffect, useState } from "react";
import { StatCard, Card, Empty } from "@/components/ui";

interface Rekap {
  bulan: string;
  totalMasuk: number;
  totalKeluar: number;
  saldo: number;
  daftarMasuk: { id: string; nominal: number; paidAt: string; user: { name: string }; tagihanWarga: { tagihan: { judul: string } } }[];
  daftarKeluar: { id: string; judul: string; kategori: string; nominal: number; tanggal: string; dicatatOleh: { name: string } }[];
}

export default function KasPage() {
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<Rekap | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ judul: "", kategori: "OPERASIONAL", nominal: 0, tanggal: "", keterangan: "" });

  async function load(b: string) {
    setLoading(true);
    const res = await fetch(`/api/kas/rekap?bulan=${b}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load(bulan);
  }, [bulan]);

  async function simpanKeluar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/kas/rekap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tanggal: form.tanggal ? new Date(form.tanggal).toISOString() : undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Gagal menyimpan");
      setShowForm(false);
      setForm({ judul: "", kategori: "OPERASIONAL", nominal: 0, tanggal: "", keterangan: "" });
      load(bulan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  const rp = (n: number) => "Rp" + n.toLocaleString("id-ID");

  return (
    <div className="anim-stagger space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Rekapitulasi Kas</h1>
          <p className="text-sm text-slate-500">Arus kas RT: pemasukan iuran dan pengeluaran operasional.</p>
        </div>
        <div className="flex gap-2">
          <input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
          <button onClick={() => setShowForm((s) => !s)}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            {showForm ? "Tutup" : "+ Pengeluaran"}
          </button>
        </div>
      </div>

      {showForm && (
        <Card title="Catat Pengeluaran">
          {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
          <form onSubmit={simpanKeluar} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Judul</label>
              <input required value={form.judul} onChange={(e) => set("judul", e.target.value)} placeholder="Bayar listrik pos satpam"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
              <select value={form.kategori} onChange={(e) => set("kategori", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">
                {["OPERASIONAL", "KEAMANAN", "KEBERSIHAN", "KEGIATAN", "DARURAT", "LAINNYA"].map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nominal (Rp)</label>
              <input required type="number" min={1000} value={form.nominal || ""} onChange={(e) => set("nominal", Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal</label>
              <input type="date" value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Keterangan</label>
              <input value={form.keterangan} onChange={(e) => set("keterangan", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div className="sm:col-span-2">
              <button disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                {saving ? "Menyimpan..." : "Simpan Pengeluaran"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {loading || !data ? (
        <div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Pemasukan" value={rp(data.totalMasuk)} icon="📥" tone="emerald" />
            <StatCard label="Pengeluaran" value={rp(data.totalKeluar)} icon="📤" tone="red" />
            <StatCard label="Saldo" value={rp(data.saldo)} icon="💰" tone={data.saldo >= 0 ? "sky" : "amber"} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title={`Pemasukan (${data.daftarMasuk.length})`}>
              {data.daftarMasuk.length === 0 ? <Empty icon="📭" title="Belum ada pemasukan" /> : (
                <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
                  {data.daftarMasuk.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{p.user.name}</p>
                        <p className="text-xs text-slate-500">{p.tagihanWarga.tagihan.judul}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-700">+{rp(p.nominal)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title={`Pengeluaran (${data.daftarKeluar.length})`}>
              {data.daftarKeluar.length === 0 ? <Empty icon="📭" title="Belum ada pengeluaran" /> : (
                <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
                  {data.daftarKeluar.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{p.judul}</p>
                        <p className="text-xs text-slate-500">{p.kategori} · oleh {p.dicatatOleh.name}</p>
                      </div>
                      <span className="text-sm font-bold text-red-600">−{rp(p.nominal)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
