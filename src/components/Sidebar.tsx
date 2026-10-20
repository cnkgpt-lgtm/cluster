"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useEscape } from "./useEscape";
import Ikon from "./Ikon";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_PER_ROLE: Record<string, NavItem[]> = {
  WARGA: [
    { href: "/dashboard", label: "Dashboard", icon: "beranda" },
    { href: "/iuran", label: "Iuran Saya", icon: "iuran" },
    { href: "/kartu-saya", label: "Kartu Saya", icon: "kartu" },
    { href: "/pengumuman", label: "Pengumuman", icon: "kabar" },
    { href: "/cctv", label: "CCTV", icon: "cctv" },
    { href: "/warga", label: "Info Warga", icon: "warga" },
    { href: "/notifikasi", label: "Notifikasi", icon: "notifikasi" },
    { href: "/profil", label: "Profil Saya", icon: "pengguna" },
  ],
  PENGURUS: [
    { href: "/dashboard", label: "Dashboard", icon: "beranda" },
    { href: "/iuran", label: "Iuran", icon: "iuran" },
    { href: "/tagihan", label: "Kelola Tagihan", icon: "iuran" },
    { href: "/validasi", label: "Validasi Bayar", icon: "validasi" },
    { href: "/kartu-kontrol", label: "Kartu Kontrol", icon: "kartu" },
    { href: "/kas", label: "Kas", icon: "kas" },
    { href: "/laporan", label: "Laporan", icon: "laporan" },
    { href: "/pengeluaran", label: "Pengeluaran", icon: "pengeluaran" },
    { href: "/pengumuman", label: "Pengumuman", icon: "kabar" },
    { href: "/cctv", label: "CCTV", icon: "cctv" },
    { href: "/warga", label: "Info Warga", icon: "warga" },
    { href: "/absensi/rekap", label: "Absensi", icon: "absensi" },
    { href: "/kondisi/rekap", label: "Foto Kondisi", icon: "kamera" },
    { href: "/pengaturan/lokasi", label: "Lokasi", icon: "peta" },
    { href: "/pengguna", label: "Pengguna", icon: "pengaturan" },
    { href: "/notifikasi", label: "Notifikasi", icon: "notifikasi" },
    { href: "/profil", label: "Profil Saya", icon: "pengguna" },
  ],
  BENDAHARA: [
    { href: "/dashboard", label: "Dashboard", icon: "beranda" },
    { href: "/iuran", label: "Iuran", icon: "iuran" },
    { href: "/tagihan", label: "Kelola Tagihan", icon: "iuran" },
    { href: "/validasi", label: "Validasi Bayar", icon: "validasi" },
    { href: "/kartu-kontrol", label: "Kartu Kontrol", icon: "kartu" },
    { href: "/kas", label: "Kas", icon: "kas" },
    { href: "/laporan", label: "Laporan", icon: "laporan" },
    { href: "/pengeluaran", label: "Pengeluaran", icon: "pengeluaran" },
    { href: "/pengumuman", label: "Pengumuman", icon: "kabar" },
    { href: "/cctv", label: "CCTV", icon: "cctv" },
    { href: "/warga", label: "Info Warga", icon: "warga" },
    { href: "/absensi/rekap", label: "Absensi", icon: "absensi" },
    { href: "/kondisi/rekap", label: "Foto Kondisi", icon: "kamera" },
    { href: "/notifikasi", label: "Notifikasi", icon: "notifikasi" },
    { href: "/profil", label: "Profil Saya", icon: "pengguna" },
  ],
  SEKRETARIS: [
    { href: "/dashboard", label: "Dashboard", icon: "beranda" },
    { href: "/kartu-kontrol", label: "Kartu Kontrol", icon: "kartu" },
    { href: "/laporan", label: "Laporan", icon: "laporan" },
    { href: "/pengumuman", label: "Pengumuman", icon: "kabar" },
    { href: "/iuran", label: "Iuran Saya", icon: "iuran" },
    { href: "/cctv", label: "CCTV", icon: "cctv" },
    { href: "/warga", label: "Info Warga", icon: "warga" },
    { href: "/absensi/rekap", label: "Absensi", icon: "absensi" },
    { href: "/kondisi/rekap", label: "Foto Kondisi", icon: "kamera" },
    { href: "/notifikasi", label: "Notifikasi", icon: "notifikasi" },
    { href: "/profil", label: "Profil Saya", icon: "pengguna" },
  ],
  SECURITY: [
    { href: "/dashboard", label: "Dashboard", icon: "beranda" },
    { href: "/absensi", label: "Absensi", icon: "absensi" },
    { href: "/kondisi", label: "Foto Kondisi", icon: "kamera" },
    { href: "/pengumuman", label: "Pengumuman", icon: "kabar" },
    { href: "/notifikasi", label: "Notifikasi", icon: "notifikasi" },
    { href: "/profil", label: "Profil Saya", icon: "pengguna" },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  WARGA: "Warga",
  PENGURUS: "Pengurus",
  BENDAHARA: "Bendahara",
  SEKRETARIS: "Sekretaris",
  SECURITY: "Security",
};

// Tab bawah khusus mobile (maks 4 + tombol "Lainnya"). `utama` = tombol tengah menonjol.
interface TabItem { href: string; label: string; icon: string; utama?: boolean }
const BOTTOM_NAV: Record<string, TabItem[]> = {
  WARGA: [
    { href: "/dashboard", label: "Beranda", icon: "beranda" },
    { href: "/pengumuman", label: "Kabar", icon: "kabar" },
    { href: "/iuran", label: "Bayar", icon: "iuran", utama: true },
    { href: "/kartu-saya", label: "Kartu", icon: "kartu" },
  ],
  PENGURUS: [
    { href: "/dashboard", label: "Beranda", icon: "beranda" },
    { href: "/iuran", label: "Iuran", icon: "iuran" },
    { href: "/validasi", label: "Validasi", icon: "validasi", utama: true },
    { href: "/laporan", label: "Laporan", icon: "laporan" },
  ],
  BENDAHARA: [
    { href: "/dashboard", label: "Beranda", icon: "beranda" },
    { href: "/kas", label: "Kas", icon: "kas" },
    { href: "/validasi", label: "Validasi", icon: "validasi", utama: true },
    { href: "/laporan", label: "Laporan", icon: "laporan" },
  ],
  SEKRETARIS: [
    { href: "/dashboard", label: "Beranda", icon: "beranda" },
    { href: "/pengumuman", label: "Kabar", icon: "kabar" },
    { href: "/kartu-kontrol", label: "Kartu", icon: "kartu", utama: true },
    { href: "/laporan", label: "Laporan", icon: "laporan" },
  ],
  SECURITY: [
    { href: "/dashboard", label: "Beranda", icon: "beranda" },
    { href: "/pengumuman", label: "Kabar", icon: "kabar" },
    { href: "/absensi", label: "Absensi", icon: "absensi", utama: true },
    { href: "/notifikasi", label: "Notifikasi", icon: "notifikasi" },
  ],
};

export default function Sidebar({
  user,
}: {
  user: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEscape(open, () => setOpen(false));
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
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
              aktif
                ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/25"
                : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            <span className="text-lg leading-none"><Ikon nama={item.icon} className="h-5 w-5" /></span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const tabs = BOTTOM_NAV[user.role] ?? BOTTOM_NAV.WARGA;

  return (
    <>
      {/* Bar atas mobile (tanpa hamburger — menu pindah ke bawah) */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <img src="/logo/logo-stacked.svg" alt="Logo SISTER" className="h-9 w-auto" />
        <Link href="/notifikasi" className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Notifikasi">
          <Ikon nama="notifikasi" className="h-5 w-5" />
        </Link>
      </div>

      {/* Navigasi bawah mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.07)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
          {tabs.slice(0, 2).map((t) => (
            <TabBawah key={t.href} tab={t} pathname={pathname} />
          ))}
          {tabs.filter((t) => t.utama).map((t) => (
            <TabUtama key={t.href} tab={t} pathname={pathname} />
          ))}
          {tabs.slice(2).filter((t) => !t.utama).map((t) => (
            <TabBawah key={t.href} tab={t} pathname={pathname} />
          ))}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-slate-500 transition active:scale-95"
          >
            <Ikon nama="menu" className="h-6 w-6" />
            <span className="text-[11px] font-semibold">Lainnya</span>
          </button>
        </div>
      </nav>

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

function tabAktif(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function TabBawah({ tab, pathname }: { tab: TabItem; pathname: string }) {
  const aktif = tabAktif(pathname, tab.href);
  return (
    <Link
      href={tab.href}
      className={`flex flex-col items-center gap-1 py-2.5 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 ${
        aktif ? "text-emerald-700" : "text-slate-500"
      }`}
    >
      <Ikon nama={tab.icon} className="h-6 w-6" />
      <span className={`text-[11px] ${aktif ? "font-bold" : "font-semibold"}`}>{tab.label}</span>
      {aktif && <span className="h-1 w-1 rounded-full bg-emerald-600" />}
    </Link>
  );
}

function TabUtama({ tab, pathname }: { tab: TabItem; pathname: string }) {
  const aktif = tabAktif(pathname, tab.href);
  return (
    <Link href={tab.href} className="flex flex-col items-center transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:rounded-2xl">
      <span
        className={`-translate-y-3 rounded-2xl p-3.5 text-2xl leading-none shadow-lg transition ${
          aktif
            ? "bg-emerald-800 text-white shadow-emerald-800/30 ring-2 ring-emerald-700 ring-offset-2"
            : "bg-emerald-700 text-white shadow-emerald-700/30"
        }`}
      >
        {tab.icon && <Ikon nama={tab.icon} className="h-7 w-7" />}
      </span>
      <span className={`-mt-2 text-[11px] font-bold ${aktif ? "text-emerald-700" : "text-slate-500"}`}>
        {tab.label}
      </span>
    </Link>
  );
}

function SidebarHead({ user, onClose }: { user: { name: string; role: string }; onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
      <div>
        <img src="/logo/logo-stacked.svg" alt="Logo SISTER" className="h-14 w-auto" />
      </div>
      {onClose && (
        <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup menu">
          <Ikon nama="silang" className="h-5 w-5" />
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
