"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui";

export interface Kamera {
  id: string;
  nama: string;
  lokasi: string | null;
  streamUrl: string;
  status: string;
  urutan: number;
}

export default function KelolaCctv({ awal }: { awal: Kamera[] }) {
  const router = useRouter();
  const [items, setItems] = useState(awal);
  const [form, setForm] = useState({ nama: "", lokasi: "", streamUrl: "", urutan: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const res = await fetch("/api/cctv");
    const data = await res.json();
    setItems(data.items ?? []);
    router.refresh();
  }

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/cctv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menambah kamera");
      setForm({ nama: "", lokasi: "", streamUrl: "", urutan: 0 });
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(k: Kamera) {
    await fetch(`/api/cctv/${k.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: k.status === "AKTIF" ? "NONAKTIF" : "AKTIF" }),
    });
    refresh();
  }

  async function hapus(k: Kamera) {
    if (!confirm(`Hapus kamera "${k.nama}"?`)) return;
    await fetch(`/api/cctv/${k.id}`, { method: "DELETE" });
    refresh();
  }

  const set = (key: string, v: string | number) => setForm((f) => ({ ...f, [key]: v }));

  return (
    <Card title="Kelola Kamera (Pengurus)">
      {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      <form onSubmit={tambah} className="grid gap-3 sm:grid-cols-2">
        <input required value={form.nama} onChange={(e) => set("nama", e.target.value)} placeholder="Nama kamera, mis. Gerbang Utama"
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
        <input value={form.lokasi} onChange={(e) => set("lokasi", e.target.value)} placeholder="Lokasi (opsional)"
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
        <input required type="url" value={form.streamUrl} onChange={(e) => set("streamUrl", e.target.value)} placeholder="URL HLS (.m3u8)"
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 sm:col-span-2" />
        <div className="flex items-center gap-3 sm:col-span-2">
          <button disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
            {saving ? "Menyimpan..." : "+ Tambah Kamera"}
          </button>
          <p className="text-xs text-slate-500">DVR/NVR Hikvision & Dahua perlu diubah dulu ke HLS (lihat DEPLOY.md).</p>
        </div>
      </form>

      <ul className="mt-4 divide-y divide-slate-100">
        {items.map((k) => (
          <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="font-semibold text-slate-800">
                {k.nama}{" "}
                <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${k.status === "AKTIF" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                  {k.status}
                </span>
              </p>
              <p className="max-w-md truncate text-xs text-slate-500">{k.lokasi ?? ""} · {k.streamUrl}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggle(k)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
                {k.status === "AKTIF" ? "Nonaktifkan" : "Aktifkan"}
              </button>
              <button onClick={() => hapus(k)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
