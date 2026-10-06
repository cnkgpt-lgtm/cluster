"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <p className="text-4xl">⚠️</p>
      <h1 className="mt-3 text-lg font-bold text-slate-900">Halaman gagal dimuat</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Terjadi kesalahan saat mengambil data. Periksa koneksi internet Anda, lalu coba lagi.
      </p>
      <button
        onClick={reset}
        className="mt-5 rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-700/25 transition hover:bg-emerald-800 active:scale-[0.98]"
      >
        Coba Lagi
      </button>
    </div>
  );
}
