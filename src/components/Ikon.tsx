// Ikon SVG garis sederhana untuk RTKu (pengganti emoji, R-04).
// Setiap ikon dipilih karena relevan dengan maknanya, bukan dekorasi.
const PATHS: Record<string, React.ReactNode> = {
  beranda: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />,
  kartu: <rect x="3" y="5" width="18" height="14" rx="2" />,
  iuran: <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z M3 10h18" />,
  kabar: <path d="M3 11v3l4 1 2 5h2l-1.5-5.5L18 17V7L6 10Z M18 7a3 3 0 0 1 0 6" />,
  laporan: <path d="M4 20V10 M10 20V4 M16 20v-8 M21 20H3" />,
  kas: <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z M7 13h4" />,
  validasi: <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6Z M9 12l2 2 4-4" />,
  warga: <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1 M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M21 19v-1a4 4 0 0 0-3-3.9 M15.5 3.1a3.5 3.5 0 0 1 0 6.8" />,
  pengguna: <path d="M19 21v-1a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v1 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  absensi: <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6Z" />,
  cctv: <path d="M3 8a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z M16 10l5-3v10l-5-3" />,
  lokasi: <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  notifikasi: <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9Z M10 20a2.2 2.2 0 0 0 4 0" />,
  pengeluaran: <path d="M12 3v12 M7 10l5 5 5-5 M4 21h16" />,
  unggah: <path d="M12 17V4 M7 8l5-5 5 5 M4 21h16" />,
  kamera: <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />,
  cetak: <path d="M7 8V3h10v5 M7 17H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-3 M7 14h10v7H7Z" />,
  kalender: <path d="M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z M4 10h16 M9 3v4 M15 3v4" />,
  peta: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2Z M9 4v14 M15 6v14" />,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
  bank: <path d="M3 9l9-6 9 6 M5 9v10 M9.5 9v10 M14.5 9v10 M19 9v10 M3 21h18" />,
  hp: <path d="M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z M11 18h2" />,
  info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 11v5 M12 8v.1" />,
  cek: <path d="M4 12.5 9.5 18 20 6.5" />,
  silang: <path d="M6 6l12 12 M18 6 6 18" />,
  peringatan: <path d="M12 3 2.5 20h19Z M12 10v4 M12 17.5v.1" />,
  masuk: <path d="M12 4v16 M6 14l6 6 6-6" />,
  keluar: <path d="M12 20V4 M6 10l6-6 6 6" />,
  pengaturan: <path d="M4 8h9 M17 8h3 M4 16h3 M11 16h9 M14 5v6 M8 13v6" />,
  menu: <path d="M4 7h16 M4 12h16 M4 17h16" />,
  lihat: <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  dokumen: <path d="M6 2h8l4 4v16H6Z M14 2v4h4 M9 12h6 M9 16h6" />,
  hapus: <path d="M4 7h16 M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2 M6 7l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14" />,
  awan: <path d="M7 18a4.5 4.5 0 1 1 .8-8.9A5.5 5.5 0 0 1 18.5 10 3.8 3.8 0 0 1 17.5 18Z" />,
  kirim: <path d="M21 3 10 14 M21 3l-7 18-4-7-7-4Z" />,
  basisdata: <path d="M12 3c4.4 0 8 1.1 8 2.5S16.4 8 12 8 4 6.9 4 5.5 7.6 3 12 3Z M4 5.5V12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5.5 M4 12v6.5c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V12" />,
};

export default function Ikon({
  nama,
  className = "h-5 w-5",
}: {
  nama: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[nama] ?? PATHS.info}
    </svg>
  );
}
