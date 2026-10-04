"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, Empty, Badge } from "@/components/ui";
import { rupiah } from "@/lib/format";

interface WargaRow {
  id: string;
  name: string;
  blok: string | null;
  nomorRumah: string | null;
  totalTagihan: number;
  lunas: number;
  menungguValidasi: number;
  belumBayar: number;
  totalNominal: number;
  totalTerbayar: number;
}

function alamatSingkat(w: WargaRow) {
  const b = [w.blok ? `Blok ${w.blok}` : null, w.nomorRumah ? `No. ${w.nomorRumah}` : null]
    .filter(Boolean)
    .join(" ");
  return b || "—";
}

export default function KartuKontrolPage() {
  const [data, setData] = useState<WargaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ditolak, setDitolak] = useState(false);
  const [cari, setCari] = useState("");

  useEffect(() => {
    fetch("/api/kartu-kontrol")
      .then((r) => {
        if (r.status === 403) setDitolak(true);
        return r.ok ? r.json() : null;
      })
      .then((d) => d && setData(d.warga ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        alamatSingkat(w).toLowerCase().includes(q),
    );
  }, [data, cari]);

  if (ditolak) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card title="Kartu Kontrol">
          <p className="text-sm text-slate-600">Halaman ini hanya untuk Bendahara, Pengurus, dan Sekretaris.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="anim-fade-up mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">🗂️ Kartu Kontrol Pembayaran</h1>
        <p className="text-sm text-slate-500">
          Rekap pembayaran tiap warga: tanggal bayar & bukti bayar terekam per tagihan.
        </p>
      </div>

      <input
        value={cari}
        onChange={(e) => setCari(e.target.value)}
        placeholder="🔍 Cari nama / blok / nomor rumah…"
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
      />

      {loading ? (
        <Card title="Memuat…">
          <div className="h-8 animate-pulse rounded-xl bg-slate-100" />
        </Card>
      ) : tampil.length === 0 ? (
        <Empty
          icon="👥"
          title="Tidak ada warga"
          sub={cari ? "Tidak cocok dengan pencarian." : "Belum ada data warga."}
        />
      ) : (
        <div className="space-y-3">
          {tampil.map((w) => (
            <Link key={w.id} href={`/kartu-kontrol/${w.id}`} className="block">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-800">{w.name}</p>
                    <p className="text-xs text-slate-500">{alamatSingkat(w)}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge tone="green">{w.lunas}/{w.totalTagihan} lunas</Badge>
                      {w.menungguValidasi > 0 && (
                        <Badge tone="amber">{w.menungguValidasi} menunggu</Badge>
                      )}
                      {w.belumBayar > 0 && (
                        <Badge tone="red">{w.belumBayar} belum bayar</Badge>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-extrabold text-emerald-700">{rupiah(w.totalTerbayar)}</p>
                    <p className="text-xs text-slate-400">dari {rupiah(w.totalNominal)}</p>
                    <p className="mt-1 text-lg text-slate-300">›</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
