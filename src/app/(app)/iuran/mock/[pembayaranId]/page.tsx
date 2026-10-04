"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";

// Halaman simulasi pembayaran — hanya dipakai saat MOCK_PAYMENT=true
export default function MockBayarPage() {
  const params = useParams<{ pembayaranId: string }>();
  const pembayaranId = params.pembayaranId;
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [metode, setMetode] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pembayaran?mine=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const p = (d?.items ?? []).find((x: { id: string }) => x.id === pembayaranId);
        if (p?.metode) setMetode(p.metode);
      })
      .catch(() => {});
  }, [pembayaranId]);

  // Hanya QRIS yang otomatis lunas; VA wajib divalidasi bendahara.
  const perluValidasi = metode !== null && metode !== "QRIS";

  async function simulasi(hasil: "PAID" | "FAILED" | "EXPIRED") {
    setLoading(hasil);
    setError("");
    try {
      const res = await fetch("/api/dev/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pembayaranId, hasil }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Simulasi gagal");
      router.push("/iuran");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      setLoading(null);
    }
  }

  return (
    <div className="anim-fade-up mx-auto max-w-md space-y-6">
      <Card title="Simulasi Pembayaran (Mode Mock)">
        <div className="flex flex-col items-center py-4">
          <div className="grid h-40 w-40 place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-5xl">
            📱
          </div>
          <p className="mt-3 text-center text-sm text-slate-500">
            Mode mock aktif — tidak ada kunci Midtrans. Pilih hasil simulasi pembayaran:
            {perluValidasi && (
              <span className="mt-1 block font-semibold text-amber-700">
                Pembayaran {metode?.replace(/_/g, " ")} wajib divalidasi bendahara sebelum lunas.
              </span>
            )}
          </p>
        </div>
        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}
        <div className="space-y-2">
          <button
            onClick={() => simulasi("PAID")}
            disabled={!!loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading === "PAID" ? "Memproses..." : perluValidasi ? "✅ Simulasikan Sudah Bayar (→ validasi bendahara)" : "✅ Simulasikan Berhasil (Lunas)"}
          </button>
          <button
            onClick={() => simulasi("FAILED")}
            disabled={!!loading}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            ❌ Simulasikan Gagal
          </button>
          <button
            onClick={() => simulasi("EXPIRED")}
            disabled={!!loading}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            ⌛ Simulasikan Kedaluwarsa
          </button>
        </div>
      </Card>
    </div>
  );
}
