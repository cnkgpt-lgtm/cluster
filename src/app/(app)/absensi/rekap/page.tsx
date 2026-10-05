"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Empty, Badge } from "@/components/ui";
import { formatTanggalWaktuWita } from "@/lib/format";

interface Item {
  userId: string;
  nama: string;
  jamMasuk: string | null;
  jamPulang: string | null;
  absensiId: string | null;
  adaFotoMasuk: boolean;
  adaFotoPulang: boolean;
  status: "BELUM_ABSEN" | "BERTUGAS" | "SELESAI";
}

const badge: Record<Item["status"], { tone: "slate" | "amber" | "green"; teks: string }> = {
  BELUM_ABSEN: { tone: "slate", teks: "Belum absen" },
  BERTUGAS: { tone: "amber", teks: "Bertugas" },
  SELESAI: { tone: "green", teks: "Selesai" },
};

function hariIni(): string {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit" });
  return f.format(new Date());
}

function SelfieViewer({ src, label }: { src: string; label: string }) {
  const [buka, setBuka] = useState(false);
  return (
    <div>
      <p className="mb-1 text-xs font-bold text-slate-500">{label}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        onClick={() => setBuka(true)}
        className="max-h-24 cursor-zoom-in rounded-xl border border-slate-200"
      />
      {buka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setBuka(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} className="max-h-full max-w-full rounded-2xl" />
        </div>
      )}
    </div>
  );
}

export default function RekapAbsensiPage() {
  const [tanggal, setTanggal] = useState(hariIni());
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [ditolak, setDitolak] = useState(false);

  const muat = useCallback(() => {
    setLoading(true);
    fetch(`/api/absensi?tanggal=${tanggal}`)
      .then((r) => {
        if (r.status === 403) setDitolak(true);
        return r.ok ? r.json() : null;
      })
      .then((d) => d && setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tanggal]);

  useEffect(() => { muat(); }, [muat]);

  const geser = (arah: 1 | -1) => {
    const [y, m, d] = tanggal.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + arah);
    setTanggal(dt.toISOString().slice(0, 10));
  };

  if (ditolak) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card title="Rekap Absensi">
          <p className="text-sm text-slate-600">Halaman ini hanya untuk Pengurus, Bendahara, dan Sekretaris.</p>
        </Card>
      </div>
    );
  }

  const hadir = items.filter((i) => i.status !== "BELUM_ABSEN").length;

  return (
    <div className="anim-fade-up mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">🛡️ Rekap Absensi Security</h1>
        <p className="text-sm text-slate-500">{hadir} dari {items.length} security hadir.</p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
        <button onClick={() => geser(-1)} className="rounded-xl px-3 py-1.5 text-lg font-bold text-slate-500 hover:bg-slate-100" aria-label="Hari sebelumnya">‹</button>
        <input
          type="date"
          value={tanggal}
          max={hariIni()}
          onChange={(e) => e.target.value && setTanggal(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-800"
        />
        <button onClick={() => geser(1)} className="rounded-xl px-3 py-1.5 text-lg font-bold text-slate-500 hover:bg-slate-100" aria-label="Hari berikutnya">›</button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Memuat…</p>
      ) : items.length === 0 ? (
        <Empty icon="🛡️" title="Belum ada akun security" sub="Tambahkan akun dengan role Security di menu Pengguna." />
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <Card key={i.userId} title={i.nama}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-slate-400">Jam masuk</p>
                    <p className="font-extrabold text-emerald-700">
                      {i.jamMasuk ? formatTanggalWaktuWita(i.jamMasuk).split(", ")[1] : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Jam pulang</p>
                    <p className="font-extrabold text-sky-700">
                      {i.jamPulang ? formatTanggalWaktuWita(i.jamPulang).split(", ")[1] : "—"}
                    </p>
                  </div>
                </div>
                <Badge tone={badge[i.status].tone}>{badge[i.status].teks}</Badge>
              </div>
              {i.absensiId && (i.adaFotoMasuk || i.adaFotoPulang) && (
                <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-100 pt-3">
                  {i.adaFotoMasuk && (
                    <SelfieViewer src={`/api/absensi/foto?id=${i.absensiId}&tipe=masuk`} label="Selfie masuk" />
                  )}
                  {i.adaFotoPulang && (
                    <SelfieViewer src={`/api/absensi/foto?id=${i.absensiId}&tipe=pulang`} label="Selfie pulang" />
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
