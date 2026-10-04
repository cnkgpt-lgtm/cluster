"use client";

import { useEffect, useState } from "react";
import { Card, Empty } from "@/components/ui";
import { rupiah, formatTanggalWita, labelMetode, labelBulan } from "@/lib/format";

interface ItemKartu {
  tagihanWargaId: string;
  judul: string;
  periode: string;
  jenis: string;
  jatuhTempo: string;
  nominal: number;
  status: string;
  pembayaran: {
    id: string;
    metode: string;
    status: string;
    tanggalBayar: string;
    penerima: string | null;
  } | null;
}

interface DataKartu {
  warga: { id: string; name: string; blok: string | null; nomorRumah: string | null };
  items: ItemKartu[];
  pengelola: { ketua: string | null; sekretaris: string | null; bendahara: string | null };
}

function keterangan(it: ItemKartu): string {
  switch (it.status) {
    case "LUNAS":
      return `Lunas via ${labelMetode(it.pembayaran?.metode ?? "")}`;
    case "MENUNGGU_VALIDASI":
      return "Menunggu validasi";
    case "KEDALUWARSA":
      return "Kedaluwarsa";
    default:
      return "Belum bayar";
  }
}

export default function KartuSayaPage() {
  const [data, setData] = useState<DataKartu | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profil")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        const id = p?.profil?.id;
        if (!id) return null;
        return fetch(`/api/kartu-kontrol?userId=${id}`).then((r) => (r.ok ? r.json() : null));
      })
      .then((d) => d && setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card title="Memuat kartu…">
          <div className="h-8 animate-pulse rounded-xl bg-slate-100" />
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl">
        <Empty icon="🪪" title="Kartu tidak tersedia" sub="Gagal memuat data kartu pembayaran." />
      </div>
    );
  }

  const tahun = new Date().getFullYear();

  return (
    <div className="anim-fade-up mx-auto max-w-3xl space-y-4">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #kartu-cetak, #kartu-cetak * { visibility: visible; }
          #kartu-cetak { position: absolute; left: 0; top: 0; width: 100%; margin: 0; }
        }
      `}</style>

      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">🪪 Kartu Saya</h1>
          <p className="text-sm text-slate-500">Kartu tanda pembayaran iuran Anda.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
        >
          🖨️ Cetak
        </button>
      </div>

      <div id="kartu-cetak" className="overflow-hidden rounded-3xl border-2 border-sky-200 bg-white shadow-sm">
        {/* Kop kartu */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-700 to-sky-600 px-5 py-5 text-center text-white">
          <p className="text-2xl font-extrabold tracking-wide">KARTU TANDA PEMBAYARAN</p>
          <p className="mt-1 text-sm font-semibold text-amber-300">KARTU KONTROL IURAN WARGA</p>
          <span className="mt-2 inline-block rounded-full bg-white/20 px-4 py-0.5 text-sm font-bold">
            TAHUN {tahun}
          </span>
        </div>

        {/* Identitas */}
        <div className="grid grid-cols-3 gap-2 border-b border-sky-100 px-5 py-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">👤 NAMA</p>
            <p className="font-bold text-slate-800">{data.warga.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">🏠 BLOK</p>
            <p className="font-bold text-slate-800">{data.warga.blok ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">🔢 NOMOR</p>
            <p className="font-bold text-slate-800">{data.warga.nomorRumah ?? "—"}</p>
          </div>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto px-3 py-3">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="border border-blue-800 px-2 py-2">NO</th>
                <th className="border border-blue-800 px-2 py-2">BULAN</th>
                <th className="border border-blue-800 px-2 py-2">JUMLAH (Rp)</th>
                <th className="border border-blue-800 px-2 py-2">PENERIMA</th>
                <th className="border border-blue-800 px-2 py-2">TANGGAL BAYAR</th>
                <th className="border border-blue-800 px-2 py-2">KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="border border-slate-200 px-2 py-6 text-center text-slate-400">
                    Belum ada tagihan.
                  </td>
                </tr>
              )}
              {data.items.map((it, i) => (
                <tr key={it.tagihanWargaId} className={i % 2 ? "bg-sky-50/50" : ""}>
                  <td className="border border-slate-200 px-2 py-2 text-center">{i + 1}</td>
                  <td className="border border-slate-200 px-2 py-2 font-semibold text-blue-900">
                    {labelBulan(it.periode)}
                  </td>
                  <td className="border border-slate-200 px-2 py-2 text-right">{it.nominal.toLocaleString("id-ID")}</td>
                  <td className="border border-slate-200 px-2 py-2 text-center text-xs">
                    {it.pembayaran?.penerima ?? "—"}
                  </td>
                  <td className="border border-slate-200 px-2 py-2 text-center text-xs">
                    {it.pembayaran ? formatTanggalWita(it.pembayaran.tanggalBayar) : "—"}
                  </td>
                  <td className="border border-slate-200 px-2 py-2 text-xs">{keterangan(it)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tim pengelola */}
        <div className="px-5 pb-2">
          <p className="inline-block rounded-t-xl bg-blue-700 px-4 py-1 text-sm font-bold text-white">
            👥 TIM PENGELOLA
          </p>
          <div className="grid grid-cols-2 gap-4 rounded-b-xl rounded-tr-xl border border-sky-200 p-4 text-center text-sm">
            <div>
              <p className="font-bold text-blue-900">1. KETUA</p>
              <p className="mt-8 border-t border-slate-300 pt-1 font-semibold text-slate-700">
                {data.pengelola.ketua ?? "—"}
              </p>
            </div>
            <div>
              <p className="font-bold text-blue-900">2. SEKRETARIS / BENDAHARA</p>
              <p className="mt-8 border-t border-slate-300 pt-1 font-semibold text-slate-700">
                {data.pengelola.sekretaris ?? data.pengelola.bendahara ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Keterangan */}
        <div className="px-5 pb-5">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-slate-600">
            <p className="font-bold text-amber-800">📢 KETERANGAN :</p>
            <ol className="mt-1 list-decimal space-y-1 pl-4">
              <li>Pembayaran iuran dapat dilakukan via QRIS, VA bank, atau transfer manual dengan mengunggah bukti.</li>
              <li>Pembayaran selain QRIS aktif (lunas) setelah divalidasi bendahara.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
