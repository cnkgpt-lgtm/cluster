"use client";

import { useEffect, useState } from "react";
import { Card, Empty, Badge } from "@/components/ui";
import BuktiViewer from "@/components/BuktiViewer";

const STORAGE_INFO: Record<string, { label: string; icon: string; ok: boolean }> = {
  R2: { label: "Cloudflare R2", icon: "☁️", ok: true },
  GOOGLE_DRIVE: { label: "Google Drive", icon: "📁", ok: true },
  TELEGRAM: { label: "Telegram", icon: "✈️", ok: true },
  DATABASE: { label: "Sementara (database)", icon: "💾", ok: false },
};

function StatusPenyimpanan() {
  const [aktif, setAktif] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/storage/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.aktif && setAktif(d.aktif))
      .catch(() => {});
  }, []);

  if (!aktif) return null;
  const info = STORAGE_INFO[aktif] ?? STORAGE_INFO.DATABASE;

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${
        info.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <span className="text-base">{info.icon}</span>
      <span>
        Penyimpanan bukti: <b>{info.label}</b>
        {!info.ok && (
          <span className="text-amber-700"> — sambungkan Telegram/Google Drive agar tersimpan permanen</span>
        )}
      </span>
      <span className="ml-auto">
        <Badge tone={info.ok ? "green" : "amber"}>{info.ok ? "Terhubung" : "Sementara"}</Badge>
      </span>
    </div>
  );
}


interface Item {
  id: string;
  nominal: number;
  metode: string;
  buktiUrl: string | null;
  createdAt: string;
  user: { name: string };
  tagihanWarga: { tagihan: { judul: string } };
}

export default function ValidasiPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [catatan, setCatatan] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const res = await fetch("/api/pembayaran?all=1");
    const data = await res.json();
    setItems((data.items ?? []).filter((p: { status: string }) => p.status === "MENUNGGU_VALIDASI"));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function putuskan(id: string, keputusan: "TERIMA" | "TOLAK") {
    if (keputusan === "TOLAK" && !catatan[id]?.trim()) {
      alert("Isi alasan penolakan dulu.");
      return;
    }
    if (!confirm(`Yakin ingin ${keputusan === "TERIMA" ? "menerima" : "menolak"} pembayaran ini?`)) return;
    setActing(id);
    const res = await fetch(`/api/pembayaran/${id}/validasi`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keputusan, catatan: catatan[id] ?? "" }),
    });
    if (!res.ok) alert("Gagal memproses validasi.");
    setActing(null);
    load();
  }

  return (
    <div className="anim-stagger space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Validasi Pembayaran</h1>
        <p className="text-sm text-slate-500">Periksa bukti transfer manual dari warga, lalu terima atau tolak.</p>
      </div>

      <StatusPenyimpanan />

      <Card title={`Menunggu Validasi (${items.length})`}>
        {loading ? (
          <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <Empty icon="✅" title="Tidak ada yang menunggu" sub="Semua bukti transfer sudah divalidasi." />
        ) : (
          <ul className="space-y-4">
            {items.map((p) => (
              <li key={p.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-800">{p.user.name}</p>
                    <p className="text-sm text-slate-500">{p.tagihanWarga.tagihan.judul}</p>
                    <p className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleString("id-ID")}</p>
                  </div>
                  <p className="text-lg font-extrabold text-slate-900">Rp{p.nominal.toLocaleString("id-ID")}</p>
                </div>

                {p.buktiUrl ? (
                  <BuktiViewer url={p.buktiUrl} pembayaranId={p.id} />
                ) : (
                  <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                    💳 Pembayaran <b>{p.metode.replace(/_/g, " ")}</b> — tanpa bukti upload.
                    Cek mutasi rekening bank RT sebelum memvalidasi.
                  </div>
                )}

                <input
                  value={catatan[p.id] ?? ""}
                  onChange={(e) => setCatatan((c) => ({ ...c, [p.id]: e.target.value }))}
                  placeholder="Catatan / alasan (wajib jika menolak)"
                  className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => putuskan(p.id, "TERIMA")}
                    disabled={acting === p.id}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {acting === p.id ? "Memproses..." : "✅ Terima & Lunaskan"}
                  </button>
                  <button
                    onClick={() => putuskan(p.id, "TOLAK")}
                    disabled={acting === p.id}
                    className="flex-1 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    ❌ Tolak
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
