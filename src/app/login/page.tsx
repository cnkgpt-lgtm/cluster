"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Ikon from "@/components/Ikon";

// Akun demo — ketuk untuk mengisi email & kata sandi otomatis.
const AKUN_DEMO = [
  { role: "Pengurus", email: "pengurus@rtku.local", password: "Pengurus123", icon: "pengguna" },
  { role: "Bendahara", email: "bendahara@rtku.local", password: "Bendahara123", icon: "kas" },
  { role: "Sekretaris", email: "sekretaris@rtku.local", password: "Sekretaris123", icon: "dokumen" },
  { role: "Security", email: "security@rtku.local", password: "Security123", icon: "absensi" },
  { role: "Warga", email: "warga@rtku.local", password: "Warga123", icon: "beranda" },
];

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(params.get("error") ? "Email atau kata sandi salah." : "");
  const [loading, setLoading] = useState(false);
  const [demoBuka, setDemoBuka] = useState(false);
  const [demoDipilih, setDemoDipilih] = useState("");

  const pilihDemo = (akun: { email: string; password: string }) => {
    setEmail(akun.email);
    setPassword(akun.password);
    setDemoDipilih(akun.email);
    setError("");
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Hanya izinkan callbackUrl berupa path internal (cegah open-redirect
    // dan nyangkut di halaman yang tidak ada).
    const rawCb = params.get("callbackUrl");
    const callbackUrl =
      rawCb && rawCb.startsWith("/") && !rawCb.startsWith("//") ? rawCb : "/dashboard";
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    if (res?.error) {
      setError("Email atau kata sandi salah.");
      setLoading(false);
    } else if (res?.url) {
      window.location.href = res.url;
    }
  }

  return (
    <div className="anim-fade-up w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
      <div className="mb-6 flex flex-col items-center text-center">
        <img src="/logo/logo-stacked.svg" alt="Logo SISTER" className="w-52 max-w-full" />
      </div>

      {error && (
        <div className="anim-pop mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Kata Sandi</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/25 transition hover:bg-emerald-800 active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? "Memeriksa..." : "Masuk"}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <button
          type="button"
          onClick={() => setDemoBuka((b) => !b)}
          className="flex w-full items-center justify-between text-sm font-semibold text-slate-600"
        >
          <span>Akun demo — {AKUN_DEMO.length} level akses</span>
          <span className="text-slate-500">{demoBuka ? "−" : "+"}</span>
        </button>
        {demoBuka && (
          <div className="anim-fade-up mt-3 space-y-2">
            {AKUN_DEMO.map((akun) => {
              const aktif = demoDipilih === akun.email;
              return (
                <button
                  key={akun.email}
                  type="button"
                  onClick={() => pilihDemo(akun)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition active:scale-[0.99] ${
                    aktif
                      ? "border-emerald-500 bg-emerald-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-emerald-300"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Ikon nama={akun.icon} className="h-5 w-5 text-slate-500" />
                    {akun.role}
                    {aktif && <span className="text-emerald-600">✓</span>}
                  </span>
                  <span className="text-xs text-slate-500">{akun.email}</span>
                </button>
              );
            })}
            <p className="pt-1 text-center text-xs text-slate-500">
              Ketuk salah satu, email & kata sandi terisi otomatis, tinggal tekan Masuk.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
