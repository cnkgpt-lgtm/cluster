"use client";

import { useState } from "react";
import { Card } from "./ui";

const inputCls =
  "w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";

export interface ProfilAwal {
  name: string;
  email: string;
  role: string;
  phone: string | null;
  alamat: string | null;
  blok: string | null;
  nomorRumah: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  WARGA: "Warga",
  PENGURUS: "Pengurus",
  BENDAHARA: "Bendahara",
  SEKRETARIS: "Sekretaris",
};

export function ProfilForms({ awal }: { awal: ProfilAwal }) {
  const [identitas, setIdentitas] = useState({
    name: awal.name,
    phone: awal.phone ?? "",
    alamat: awal.alamat ?? "",
    blok: awal.blok ?? "",
    nomorRumah: awal.nomorRumah ?? "",
  });
  const [savingId, setSavingId] = useState(false);
  const [msgId, setMsgId] = useState<{ ok: boolean; teks: string } | null>(null);

  const [pw, setPw] = useState({ saatIni: "", baru: "", konfirmasi: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [msgPw, setMsgPw] = useState<{ ok: boolean; teks: string } | null>(null);

  const setI = (k: string, v: string) => setIdentitas((f) => ({ ...f, [k]: v }));
  const setP = (k: string, v: string) => setPw((f) => ({ ...f, [k]: v }));

  async function simpanIdentitas(e: React.FormEvent) {
    e.preventDefault();
    setSavingId(true);
    setMsgId(null);
    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(identitas),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "Gagal menyimpan");
      setMsgId({ ok: true, teks: "Identitas berhasil disimpan." });
    } catch (e) {
      setMsgId({ ok: false, teks: e instanceof Error ? e.message : "Terjadi kesalahan" });
    } finally {
      setSavingId(false);
    }
  }

  async function gantiPassword(e: React.FormEvent) {
    e.preventDefault();
    setMsgPw(null);
    if (pw.baru !== pw.konfirmasi) {
      setMsgPw({ ok: false, teks: "Konfirmasi kata sandi baru tidak sama." });
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch("/api/profil/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saatIni: pw.saatIni, baru: pw.baru }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "Gagal mengganti kata sandi");
      setMsgPw({ ok: true, teks: "Kata sandi berhasil diganti." });
      setPw({ saatIni: "", baru: "", konfirmasi: "" });
    } catch (e) {
      setMsgPw({ ok: false, teks: e instanceof Error ? e.message : "Terjadi kesalahan" });
    } finally {
      setSavingPw(false);
    }
  }

  const alert = (m: { ok: boolean; teks: string } | null) =>
    m && (
      <div
        className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
          m.ok
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}
      >
        {m.teks}
      </div>
    );

  return (
    <div className="space-y-6">
      <Card title="Identitas Saya">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl">👤</span>
          <div>
            <p className="font-bold text-slate-900">{awal.name}</p>
            <p className="text-xs text-slate-500">
              {awal.email} · {ROLE_LABEL[awal.role] ?? awal.role}
            </p>
          </div>
        </div>
        {alert(msgId)}
        <form onSubmit={simpanIdentitas} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Nama Lengkap *</label>
            <input required value={identitas.name} onChange={(e) => setI("name", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">No. WhatsApp</label>
            <input
              value={identitas.phone}
              onChange={(e) => setI("phone", e.target.value)}
              placeholder="cth: 081234567890"
              inputMode="tel"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Blok</label>
              <input value={identitas.blok} onChange={(e) => setI("blok", e.target.value)} placeholder="A" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">No. Rumah</label>
              <input value={identitas.nomorRumah} onChange={(e) => setI("nomorRumah", e.target.value)} placeholder="12" className={inputCls} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Alamat Lengkap</label>
            <textarea
              value={identitas.alamat}
              onChange={(e) => setI("alamat", e.target.value)}
              placeholder="cth: Jl. Mawar No. 12, Perumahan Griya Asri"
              rows={2}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={savingId}
              className="rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-700/25 transition hover:bg-emerald-800 active:scale-[0.99] disabled:opacity-60"
            >
              {savingId ? "Menyimpan..." : "Simpan Identitas"}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Ganti Kata Sandi">
        {alert(msgPw)}
        <form onSubmit={gantiPassword} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Kata Sandi Saat Ini *</label>
            <input
              required
              type="password"
              value={pw.saatIni}
              onChange={(e) => setP("saatIni", e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Kata Sandi Baru *</label>
            <input
              required
              type="password"
              minLength={6}
              value={pw.baru}
              onChange={(e) => setP("baru", e.target.value)}
              placeholder="Minimal 6 karakter"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Konfirmasi Kata Sandi Baru *</label>
            <input
              required
              type="password"
              minLength={6}
              value={pw.konfirmasi}
              onChange={(e) => setP("konfirmasi", e.target.value)}
              placeholder="Ulangi kata sandi baru"
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={savingPw}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 active:scale-[0.99] disabled:opacity-60"
            >
              {savingPw ? "Menyimpan..." : "Ganti Kata Sandi"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
