"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "./ui";

const KATEGORI = ["OPERASIONAL", "KEAMANAN", "KEBERSIHAN", "KEGIATAN", "DARURAT", "LAINNYA"];

const inputCls =
  "w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";

export function FormPengeluaran() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    judul: "",
    kategori: "OPERASIONAL",
    nominal: "",
    tanggal: "",
    keterangan: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/kas/rekap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: form.judul,
          kategori: form.kategori,
          nominal: Number(form.nominal),
          tanggal: form.tanggal ? new Date(form.tanggal).toISOString() : undefined,
          keterangan: form.keterangan || undefined,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "Gagal menyimpan pengeluaran");
      setOpen(false);
      setForm({ judul: "", kategori: "OPERASIONAL", nominal: "", tanggal: "", keterangan: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen((s) => !s)}
        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.99]"
      >
        {open ? "Tutup" : "+ Catat Pengeluaran"}
      </button>

      {open && (
        <Card title="Catat Pengeluaran Baru">
          {error && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={simpan} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Judul *</label>
              <input
                required
                value={form.judul}
                onChange={(e) => set("judul", e.target.value)}
                placeholder="cth: Bayar listrik pos satpam"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
              <select value={form.kategori} onChange={(e) => set("kategori", e.target.value)} className={inputCls}>
                {KATEGORI.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nominal (Rp) *</label>
              <input
                required
                type="number"
                min={1000}
                value={form.nominal}
                onChange={(e) => set("nominal", e.target.value)}
                placeholder="50000"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal</label>
              <input
                type="date"
                value={form.tanggal}
                onChange={(e) => set("tanggal", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Keterangan</label>
              <input
                value={form.keterangan}
                onChange={(e) => set("keterangan", e.target.value)}
                placeholder="Opsional"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan Pengeluaran"}
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

export function TombolHapusPengeluaran({ id, judul }: { id: string; judul: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function hapus() {
    if (!window.confirm(`Hapus pengeluaran "${judul}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/pengeluaran/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("gagal");
      router.refresh();
    } catch {
      alert("Gagal menghapus pengeluaran.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={hapus}
      disabled={busy}
      aria-label={`Hapus ${judul}`}
      title="Hapus"
      className="rounded-lg p-1.5 text-lg leading-none text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {busy ? "…" : "🗑️"}
    </button>
  );
}
