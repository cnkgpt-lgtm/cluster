"use client";

import { useEffect, useState } from "react";
import { Card, Badge, Empty } from "@/components/ui";

interface Pengguna {
  id: string;
  name: string;
  email: string;
  role: string;
  blok: string | null;
  nomorRumah: string | null;
  phone: string | null;
  alamat: string | null;
  isActive: boolean;
}

const ROLES = ["WARGA", "PENGURUS", "BENDAHARA", "SEKRETARIS", "SECURITY"];

export default function PenggunaPage() {
  const [items, setItems] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "WARGA", blok: "", nomorRumah: "", phone: "", alamat: "" });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/pengguna");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pengguna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menambah pengguna");
      setShowForm(false);
      setForm({ name: "", email: "", password: "", role: "WARGA", blok: "", nomorRumah: "", phone: "", alamat: "" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  async function ubah(id: string, patch: Partial<Pengguna>) {
    const res = await fetch(`/api/admin/pengguna/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) alert("Gagal menyimpan perubahan.");
    load();
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="anim-fade-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Kelola Pengguna</h1>
          <p className="text-sm text-slate-500">Setiap warga memiliki akun. Atur role: Warga, Pengurus, Bendahara, Sekretaris.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)}
          className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
          {showForm ? "Tutup" : "+ Pengguna"}
        </button>
      </div>

      {showForm && (
        <Card title="Pengguna Baru">
          {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
          <form onSubmit={tambah} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nama</label>
              <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Kata Sandi</label>
              <input required type="password" minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
              <select value={form.role} onChange={(e) => set("role", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Blok</label>
              <input value={form.blok} onChange={(e) => set("blok", e.target.value)} placeholder="A"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">No. Rumah</label>
              <input value={form.nomorRumah} onChange={(e) => set("nomorRumah", e.target.value)} placeholder="12"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">No. WhatsApp</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="081234567890"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Alamat Lengkap</label>
              <input value={form.alamat} onChange={(e) => set("alamat", e.target.value)} placeholder="Jl. Mawar No. 12, Perumahan Griya Asri"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div className="sm:col-span-2">
              <button disabled={saving} className="rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
                {saving ? "Menyimpan..." : "Simpan Pengguna"}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`Semua Pengguna (${items.length})`}>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <Empty icon="👥" title="Belum ada pengguna" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                  <th className="py-2 pr-4">Nama</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Alamat</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 pr-4 font-semibold text-slate-800">{u.name}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{u.email}</td>
                    <td className="py-2.5 pr-4">
                      <select value={u.role} onChange={(e) => ubah(u.id, { role: e.target.value })}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold">
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500">
                      {u.blok ? `Blok ${u.blok}` : "-"}{u.nomorRumah ? ` No.${u.nomorRumah}` : ""}
                    </td>
                    <td className="py-2.5">
                      <button onClick={() => ubah(u.id, { isActive: !u.isActive })}>
                        <Badge tone={u.isActive ? "green" : "red"}>{u.isActive ? "Aktif" : "Nonaktif"}</Badge>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
