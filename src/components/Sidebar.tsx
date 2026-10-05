"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_PER_ROLE: Record<string, NavItem[]> = {
  WARGA: [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/iuran", label: "Iuran Saya", icon: "💳" },
    { href: "/kartu-saya", label: "Kartu Saya", icon: "🪪" },
    { href: "/pengumuman", label: "Pengumuman", icon: "📢" },
    { href: "/cctv", label: "CCTV", icon: "📹" },
    { href: "/warga", label: "Info Warga", icon: "👥" },
    { href: "/notifikasi", label: "Notifikasi", icon: "🔔" },
    { href: "/profil", label: "Profil Saya", icon: "👤" },
  ],
  PENGURUS: [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/iuran", label: "Iuran", icon: "💳" },
    { href: "/tagihan", label: "Kelola Tagihan", icon: "🧾" },
    { href: "/validasi", label: "Validasi Bayar", icon: "✅" },
    { href: "/kartu-kontrol", label: "Kartu Kontrol", icon: "🗂️" },
    { href: "/kas", label: "Kas", icon: "💰" },
    { href: "/laporan", label: "Laporan", icon: "📊" },
    { href: "/pengeluaran", label: "Pengeluaran", icon: "💸" },
    { href: "/pengumuman", label: "Pengumuman", icon: "📢" },
    { href: "/cctv", label: "CCTV", icon: "📹" },
    { href: "/warga", label: "Info Warga", icon: "👥" },
    { href: "/absensi/rekap", label: "Absensi", icon: "🛡️" },
    { href: "/pengaturan/lokasi", label: "Lokasi", icon: "🗺️" },
    { href: "/pengguna", label: "Pengguna", icon: "⚙️" },
    { href: "/notifikasi", label: "Notifikasi", icon: "🔔" },
    { href: "/profil", label: "Profil Saya", icon: "👤" },
  ],
  BENDAHARA: [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/iuran", label: "Iuran", icon: "💳" },
    { href: "/tagihan", label: "Kelola Tagihan", icon: "🧾" },
    { href: "/validasi", label: "Validasi Bayar", icon: "✅" },
    { href: "/kartu-kontrol", label: "Kartu Kontrol", icon: "🗂️" },
    { href: "/kas", label: "Kas", icon: "💰" },
    { href: "/laporan", label: "Laporan", icon: "📊" },
    { href: "/pengeluaran", label: "Pengeluaran", icon: "💸" },
    { href: "/pengumuman", label: "Pengumuman", icon: "📢" },
    { href: "/cctv", label: "CCTV", icon: "📹" },
    { href: "/warga", label: "Info Warga", icon: "👥" },
    { href: "/absensi/rekap", label: "Absensi", icon: "🛡️" },
    { href: "/notifikasi", label: "Notifikasi", icon: "🔔" },
    { href: "/profil", label: "Profil Saya", icon: "👤" },
  ],
  SEKRETARIS: [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/kartu-kontrol", label: "Kartu Kontrol", icon: "🗂️" },
    { href: "/laporan", label: "Laporan", icon: "📊" },
    { href: "/pengumuman", label: "Pengumuman", icon: "📢" },
    { href: "/iuran", label: "Iuran Saya", icon: "💳" },
    { href: "/cctv", label: "CCTV", icon: "📹" },
    { href: "/warga", label: "Info Warga", icon: "👥" },
    { href: "/absensi/rekap", label: "Absensi", icon: "🛡️" },
    { href: "/notifikasi", label: "Notifikasi", icon: "🔔" },
    { href: "/profil", label: "Profil Saya", icon: "👤" },
  ],
  SECURITY: [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/absensi", label: "Absensi", icon: "🛡️" },
    { href: "/pengumuman", label: "Pengumuman", icon: "📢" },
    { href: "/notifikasi", label: "Notifikasi", icon: "🔔" },
    { href: "/profil", label: "Profil Saya", icon: "👤" },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  WARGA: "Warga",
  PENGURUS: "Pengurus",
  BENDAHARA: "Bendahara",
  SEKRETARIS: "Sekretaris",
  SECURITY: "Security",
};

export default function Sidebar({
  user,
}: {
  user: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = NAV_PER_ROLE[user.role] ?? NAV_PER_ROLE.WARGA;

  const menu = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {nav.map((item) => {
        const aktif = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              aktif
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Bar atas mobile */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-slate-200 p-2 text-slate-600"
          aria-label="Buka menu"
        >
          ☰
        </button>
        <span className="text-lg font-bold text-emerald-700">🌿 RTKu</span>
        <Link href="/notifikasi" className="rounded-lg border border-slate-200 p-2 text-slate-600">
          🔔
        </Link>
      </div>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="anim-fade-in absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="anim-pop absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl">
            <SidebarHead user={user} onClose={() => setOpen(false)} />
            {menu}
            <SidebarFoot user={user} />
          </aside>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <SidebarHead user={user} />
        {menu}
        <SidebarFoot user={user} />
      </aside>
    </>
  );
}

function SidebarHead({ user, onClose }: { user: { name: string; role: string }; onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
      <div>
        <p className="text-xl font-extrabold tracking-tight text-emerald-700">🌿 RTKu</p>
        <p className="text-xs text-slate-500">RT/R Perumahan</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup menu">
          ✕
        </button>
      )}
    </div>
  );
}

function SidebarFoot({ user }: { user: { name: string; email: string; role: string } }) {
  return (
    <div className="border-t border-slate-100 p-4">
      <div className="mb-3 rounded-xl bg-slate-50 p-3">
        <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
        <p className="text-xs text-slate-500">{ROLE_LABEL[user.role] ?? user.role}</p>
      </div>
      <form action="/api/auth/signout" method="post">
        <button
          type="submit"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
        >
          Keluar
        </button>
      </form>
    </div>
  );
}
