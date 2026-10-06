"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui";

// Halaman simulasi pembayaran QRIS — hanya dipakai saat MOCK_PAYMENT=true.
// VA & transfer manual memakai upload bukti + validasi bendahara (tanpa simulasi).
export default function MockBayarPage() {
  const params = useParams<{ pembayaranId: string }>();
  const pembayaranId = params.pembayaranId;
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

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
      <Card title="Simulasi Pembayaran QRIS (Mode Mock)">
        <div className="flex flex-col items-center py-4">
          <div className="grid h-40 w-40 place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-5xl">
            📱
          </div>
          <p className="mt-3 text-center text-sm text-slate-500">
            Mode mock aktif. Tidak ada kunci Midtrans. QRIS otomatis lunas
            (tidak perlu validasi bendahara). Pilih hasil simulasi:
          </p>
        </div>
        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}
        <div className="space-y-2">
          <button
            onClick={() => simulasi("PAID")}
            disabled={!!loading}
            className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {loading === "PAID" ? "Memproses..." : "✅ Simulasikan Berhasil (Lunas)"}
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
        <Link
          href="/iuran"
          className="mt-4 block text-center text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          ← Kembali ke Iuran
        </Link>
      </Card>
    </div>
  );
}
