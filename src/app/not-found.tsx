import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 text-center">
      <p className="text-7xl">🧭</p>
      <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-slate-900">404</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Halaman yang Anda tuju tidak ditemukan. Mungkin alamatnya salah ketik atau sudah tidak tersedia.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/25 transition hover:bg-emerald-800 active:scale-[0.99]"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
