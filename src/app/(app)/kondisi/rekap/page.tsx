"use client";

import { useCallback, useEffect, useState } from "react";
import Ikon from "@/components/Ikon";
import { useEscape } from "@/components/useEscape";
import { Card, Empty, Badge } from "@/components/ui";
import { formatTanggalWita, formatTanggalWaktuWita } from "@/lib/format";

interface Item {
  id: string;
  nama: string;
  keterangan: string | null;
  kelurahan: string | null;
  kecamatan: string | null;
  lat: number;
  lng: number;
  akurasi: number | null;
  createdAt: string;
}

function isoHariIni(): string {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  return s; // YYYY-MM-DD
}

export default function KondisiRekapPage() {
  const [tanggal, setTanggal] = useState(isoHariIni);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [ditolak, setDitolak] = useState(false);
  const [lihat, setLihat] = useState<Item | null>(null);
  useEscape(lihat !== null, () => setLihat(null));

  const muat = useCallback(() => {
    setLoading(true);
    fetch(`/api/kondisi?tanggal=${tanggal}`)
      .then((r) => {
        if (r.status === 403) setDitolak(true);
        return r.ok ? r.json() : null;
      })
      .then((d) => { if (d) setItems(d.items ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tanggal]);

  useEffect(() => { muat(); }, [muat]);

  if (ditolak) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card title="Foto Kondisi"><p className="text-sm text-slate-600">Halaman ini hanya untuk pengelola.</p></Card>
      </div>
    );
  }

  return (
    <div className="anim-fade-up mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold text-slate-800">
          <Ikon nama="kamera" className="h-6 w-6" /> Foto Kondisi Cluster
        </h1>
        <p className="text-sm text-slate-500">Foto situasi terkini yang dikirim security — sudah tercetak tanggal, jam, dan lokasi.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-700"
          aria-label="Tanggal foto"
        />
        <span className="text-sm font-semibold text-slate-600">{formatTanggalWita(new Date(`${tanggal}T12:00:00+08:00`))}</span>
        <Badge tone="slate">{items.length} foto</Badge>
      </div>

      {loading ? (
        <Card title="Memuat…"><p className="text-sm text-slate-500">Memuat foto…</p></Card>
      ) : items.length === 0 ? (
        <Empty icon="kamera" title="Belum ada foto" sub="Security belum mengirim foto kondisi pada tanggal ini." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setLihat(it)}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <img
                src={`/api/kondisi/foto?id=${it.id}`}
                alt={it.keterangan ?? "Foto kondisi"}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-2.5">
                <p className="truncate text-sm font-bold text-slate-800">{it.nama}</p>
                <p className="text-xs text-slate-500">{formatTanggalWaktuWita(it.createdAt)}</p>
                {it.keterangan && <p className="truncate text-xs text-slate-600">{it.keterangan}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {lihat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setLihat(null)}>
          <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={`/api/kondisi/foto?id=${lihat.id}`}
              alt={lihat.keterangan ?? "Foto kondisi"}
              className="w-full rounded-2xl"
            />
            <div className="mt-3 flex items-start justify-between gap-3 rounded-2xl bg-white p-4">
              <div>
                <p className="font-bold text-slate-800">{lihat.nama} (Security)</p>
                <p className="text-sm text-slate-500">{formatTanggalWaktuWita(lihat.createdAt)}</p>
                {(lihat.kelurahan || lihat.kecamatan) && (
                  <p className="text-sm font-semibold text-slate-600">
                    {[lihat.kelurahan && `Kel. ${lihat.kelurahan}`, lihat.kecamatan && `Kec. ${lihat.kecamatan}`].filter(Boolean).join(", ")}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  {lihat.lat.toFixed(5)}, {lihat.lng.toFixed(5)}
                  {lihat.akurasi != null && ` · akurasi ±${Math.round(lihat.akurasi)} m`}
                  {" · "}<a
                    className="font-semibold text-emerald-700 underline"
                    href={`https://www.google.com/maps?q=${lihat.lat},${lihat.lng}`}
                    target="_blank" rel="noreferrer"
                  >Lihat di peta</a>
                </p>
                {lihat.keterangan && <p className="mt-1 text-sm text-slate-700">{lihat.keterangan}</p>}
              </div>
              <button onClick={() => setLihat(null)} className="rounded-full bg-slate-100 p-2" aria-label="Tutup">
                <Ikon nama="silang" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
