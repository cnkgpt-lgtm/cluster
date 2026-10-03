"use client";

import { useEffect, useState } from "react";
import { Card, Empty } from "@/components/ui";

interface Tagihan {
  id: string;
  judul: string;
  periode: string;
  jenis: string;
  nominal: number;
  jatuhTempo: string;
  _count: { items: number };
  dibuatOleh: { name: string };
  createdAt: string;
}

const JENIS = ["IURAN_BULANAN", "IURAN_KEAMANAN", "IURAN_KEBERSIHAN", "IURAN_SOSIAL", "LAINNYA"];

export default function TagihanPage() {
  const [items, setItems] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    judul: "",
    periode: new Date().toISOString().slice(0, 7),
    jenis: "IURAN_BULANAN",
    nominal: 50000,
    jatuhTempo: "",
    keterangan: "",
  });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/tagihan");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tagihan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          jatuhTempo: new Date(form.jatuhTempo).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? "Gagal membuat tagihan");
      setShowForm(false);
      setForm({ judul: "", periode: new Date().toISOString().slice(0, 7), jenis: "IURAN_BULANAN", nominal: 50000, jatuhTempo: "", keterangan: "" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="anim-stagger space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Kelola Tagihan</h1>
          <p className="text-sm text-slate-500">Terbitkan tagihan iuran ke seluruh warga.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
        >
          {showForm ? "Tutup" : "+ Tagihan Baru"}
        </button>
      </div>

      {showForm && (
        <Card title="Tagihan Baru">
          {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Judul</label>
              <input required value={form.judul} onChange={(e) => set("judul", e.target.value)} placeholder="Iuran Bulanan Oktober 2026"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Periode (YYYY-MM)</label>
              <input required value={form.periode} onChange={(e) => set("periode", e.target.value)} pattern="\d{4}-\d{2}" placeholder="2026-10"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Jenis</label>
              <select value={form.jenis} onChange={(e) => set("jenis", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">
                {JENIS.map((j) => <option key={j} value={j}>{j.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nominal (Rp)</label>
              <input required type="number" min={1000} value={form.nominal} onChange={(e) => set("nominal", Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Jatuh Tempo</label>
              <input required type="datetime-local" value={form.jatuhTempo} onChange={(e) => set("jatuhTempo", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Keterangan (opsional)</label>
              <textarea value={form.keterangan} onChange={(e) => set("keterangan", e.target.value)} rows={2}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div className="sm:col-span-2">
              <button disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                {saving ? "Menerbitkan..." : "Terbitkan ke Seluruh Warga"}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Daftar Tagihan">
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <Empty icon="🧾" title="Belum ada tagihan" sub="Buat tagihan pertama untuk warga." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-semibold text-slate-800">{t.judul}</p>
                  <p className="text-xs text-slate-500">
                    Periode {t.periode} · {t._count.items} warga · oleh {t.dibuatOleh.name}
                  </p>
                </div>
                <span className="font-bold text-slate-900">Rp{t.nominal.toLocaleString("id-ID")}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
