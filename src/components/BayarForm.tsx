"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        opts?: {
          onSuccess?: (r: unknown) => void;
          onPending?: (r: unknown) => void;
          onError?: (r: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

const METODE = [
  { id: "QRIS", label: "QRIS", desc: "Scan QR dari e-wallet / m-banking apa pun — otomatis lunas", icon: "📱" },
  { id: "VA_BCA", label: "VA BCA", desc: "Virtual Account Bank BCA — validasi bendahara", icon: "🏦" },
  { id: "VA_BRI", label: "VA BRI", desc: "Virtual Account Bank BRI — validasi bendahara", icon: "🏦" },
  { id: "VA_BNI", label: "VA BNI", desc: "Virtual Account Bank BNI — validasi bendahara", icon: "🏦" },
  { id: "VA_MANDIRI", label: "VA Mandiri", desc: "Virtual Account Bank Mandiri — validasi bendahara", icon: "🏦" },
  { id: "VA_PERMATA", label: "VA Permata", desc: "Virtual Account Bank Permata — validasi bendahara", icon: "🏦" },
  { id: "TRANSFER_MANUAL", label: "Transfer Manual", desc: "Transfer ke rekening RT lalu unggah bukti — validasi bendahara", icon: "🧾" },
];

function loadSnap(scriptUrl: string, clientKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.snap) return resolve();
    const s = document.createElement("script");
    s.src = scriptUrl;
    s.setAttribute("data-client-key", clientKey);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Gagal memuat Snap Midtrans"));
    document.body.appendChild(s);
  });
}

export default function BayarForm({
  tagihanWargaId,
  nominal,
}: {
  tagihanWargaId: string;
  nominal: number;
}) {
  const router = useRouter();
  const [metode, setMetode] = useState("QRIS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [namaFile, setNamaFile] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function bayarOnline() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pembayaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagihanWargaId, metode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? "Gagal membuat pembayaran");

      if (data.mock) {
        router.push(`/iuran/mock/${data.pembayaranId}`);
        return;
      }
      await loadSnap(data.snapScriptUrl, data.clientKey);
      window.snap!.pay(data.snapToken, {
        onSuccess: () => router.push("/iuran"),
        onPending: () => router.push("/iuran"),
        onError: () => setError("Pembayaran gagal. Silakan coba lagi."),
        onClose: () => setLoading(false),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      setLoading(false);
    }
  }

  async function bayarManual() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Pilih file bukti transfer dulu (JPG/PNG/WEBP/PDF, maks 5 MB).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("tagihanWargaId", tagihanWargaId);
      form.append("metode", "TRANSFER_MANUAL");
      form.append("bukti", file);
      const res = await fetch("/api/pembayaran", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? "Gagal mengunggah bukti");
      router.push("/iuran");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="anim-pop rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="text-sm font-semibold text-slate-700">Pilih metode pembayaran</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {METODE.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMetode(m.id)}
            className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${
              metode === m.id
                ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <span className="text-2xl">{m.icon}</span>
            <span>
              <span className="block font-bold text-slate-800">{m.label}</span>
              <span className="block text-xs text-slate-500">{m.desc}</span>
            </span>
          </button>
        ))}
      </div>

      {metode === "TRANSFER_MANUAL" && (
        <div className="anim-fade-in rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">Transfer manual</p>
          <p className="mt-1 text-sm text-amber-700">
            Transfer sebesar <b>Rp{nominal.toLocaleString("id-ID")}</b> ke rekening bendahara RT,
            lalu unggah bukti transfer di bawah. Pembayaran aktif setelah divalidasi bendahara.
          </p>
          <label className="mt-3 flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-amber-300 bg-white px-4 py-6 text-center transition hover:border-amber-400 hover:bg-amber-50">
            <span className="text-3xl">📤</span>
            <span className="text-sm font-bold text-amber-800">
              {namaFile ? `📄 ${namaFile}` : "Ketuk untuk upload bukti transfer"}
            </span>
            <span className="text-xs text-slate-500">JPG / PNG / WEBP / PDF, maks 5 MB</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => setNamaFile(e.target.files?.[0]?.name ?? "")}
            />
          </label>
        </div>
      )}

      <button
        onClick={metode === "TRANSFER_MANUAL" ? bayarManual : bayarOnline}
        disabled={loading}
        className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
      >
        {loading
          ? "Memproses..."
          : metode === "TRANSFER_MANUAL"
            ? "Unggah Bukti & Kirim"
            : `Bayar Rp${nominal.toLocaleString("id-ID")}`}
      </button>
    </div>
  );
}
