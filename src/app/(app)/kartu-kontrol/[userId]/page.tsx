"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Empty, Badge } from "@/components/ui";
import BuktiViewer from "@/components/BuktiViewer";
import { rupiah, formatTanggalWita, formatTanggalWaktuWita, labelMetode, labelJenis } from "@/lib/format";

interface PembayaranInfo {
  id: string;
  metode: string;
  status: string;
  nominal: number;
  buktiUrl: string | null;
  tanggalBayar: string;
  validatedAt: string | null;
}

interface ItemKartu {
  tagihanWargaId: string;
  judul: string;
  periode: string;
  jenis: string;
  jatuhTempo: string;
  nominal: number;
  status: string;
  pembayaran: PembayaranInfo | null;
}

interface Detail {
  warga: { id: string; name: string; blok: string | null; nomorRumah: string | null; phone: string | null; alamat: string | null };
  ringkasan: { totalTagihan: number; lunas: number; menungguValidasi: number; belumBayar: number; totalNominal: number; totalTerbayar: number };
  items: ItemKartu[];
}

function badgeStatus(s: string) {
  switch (s) {
    case "LUNAS":
      return <Badge tone="green">Lunas</Badge>;
    case "MENUNGGU_VALIDASI":
      return <Badge tone="amber">Menunggu validasi</Badge>;
    case "KEDALUWARSA":
      return <Badge tone="slate">Kedaluwarsa</Badge>;
    default:
      return <Badge tone="red">Belum bayar</Badge>;
  }
}

export default function DetailKartuKontrolPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [gagal, setGagal] = useState("");

  useEffect(() => {
    fetch(`/api/kartu-kontrol?userId=${userId}`)
      .then((r) => {
        if (r.status === 403) throw new Error("FORBIDDEN");
        if (!r.ok) throw new Error("GAGAL");
        return r.json();
      })
      .then((d) => setData(d))
      .catch((e) => setGagal(e.message === "FORBIDDEN" ? "forbidden" : "gagal"))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card title="Memuat kartu kontrol…">
          <div className="h-8 animate-pulse rounded-xl bg-slate-100" />
        </Card>
      </div>
    );
  }

  if (gagal || !data) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card title="Kartu Kontrol">
          <p className="text-sm text-slate-600">
            {gagal === "forbidden"
              ? "Halaman ini hanya untuk Bendahara, Pengurus, dan Sekretaris."
              : "Data tidak ditemukan."}
          </p>
          <Link href="/kartu-kontrol" className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline">
            ← Kembali ke daftar
          </Link>
        </Card>
      </div>
    );
  }

  const { warga, ringkasan, items } = data;
  const alamat = [warga.blok ? `Blok ${warga.blok}` : null, warga.nomorRumah ? `No. ${warga.nomorRumah}` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="anim-fade-up mx-auto max-w-3xl space-y-4">
      <Link href="/kartu-kontrol" className="text-sm font-semibold text-emerald-700 hover:underline">
        ← Kembali ke daftar warga
      </Link>

      <Card title="🗂️ Kartu Kontrol Pembayaran">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold text-slate-800">{warga.name}</p>
            <p className="text-sm text-slate-500">
              {[alamat, warga.phone].filter(Boolean).join(" • ") || "—"}
            </p>
            {warga.alamat && <p className="mt-1 text-xs text-slate-400">{warga.alamat}</p>}
          </div>
          <div className="text-right text-sm">
            <p>
              <b className="text-emerald-700">{rupiah(ringkasan.totalTerbayar)}</b>
              <span className="text-slate-400"> / {rupiah(ringkasan.totalNominal)}</span>
            </p>
            <p className="text-xs text-slate-500">total terbayar</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="green">{ringkasan.lunas} lunas</Badge>
          {ringkasan.menungguValidasi > 0 && <Badge tone="amber">{ringkasan.menungguValidasi} menunggu validasi</Badge>}
          {ringkasan.belumBayar > 0 && <Badge tone="red">{ringkasan.belumBayar} belum bayar</Badge>}
        </div>
      </Card>

      {items.length === 0 ? (
        <Empty icon="🧾" title="Belum ada tagihan" sub="Warga ini belum memiliki tagihan." />
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.tagihanWargaId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800">{it.judul}</p>
                  <p className="text-xs text-slate-500">
                    {labelJenis(it.jenis)} • Periode {it.periode} • Jatuh tempo {formatTanggalWita(it.jatuhTempo)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-extrabold text-slate-800">{rupiah(it.nominal)}</p>
                  <div className="mt-1">{badgeStatus(it.status)}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Tanggal bayar</p>
                  <p className="font-semibold text-slate-700">
                    {it.pembayaran ? formatTanggalWaktuWita(it.pembayaran.tanggalBayar) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Metode</p>
                  <p className="font-semibold text-slate-700">
                    {it.pembayaran ? labelMetode(it.pembayaran.metode) : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Kolom bukti bayar</p>
                {it.pembayaran?.buktiUrl ? (
                  <BuktiViewer url={it.pembayaran.buktiUrl} pembayaranId={it.pembayaran.id} ringkas />
                ) : (
                  <p className="mt-1 text-sm text-slate-400">
                    {it.pembayaran ? "Otomatis (tanpa bukti upload)" : "—"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
