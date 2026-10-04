const WITA = "Asia/Makassar";

export function rupiah(n: number): string {
  return "Rp" + n.toLocaleString("id-ID");
}

export function formatTanggalWita(d: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WITA,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(d));
}

export function formatTanggalWaktuWita(d: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WITA,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export function periodeSekarang(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: WITA }));
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const LABEL_METODE: Record<string, string> = {
  QRIS: "QRIS",
  VA_BCA: "VA BCA",
  VA_BNI: "VA BNI",
  VA_BRI: "VA BRI",
  VA_MANDIRI: "VA Mandiri",
  VA_PERMATA: "VA Permata",
  TRANSFER_MANUAL: "Transfer Manual",
};

export function labelMetode(m: string): string {
  return LABEL_METODE[m] ?? m;
}

const LABEL_STATUS_BAYAR: Record<string, string> = {
  PENDING: "Menunggu Pembayaran",
  MENUNGGU_VALIDASI: "Menunggu Validasi",
  PAID: "Lunas",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
  DITOLAK: "Ditolak",
};

export function labelStatusBayar(s: string): string {
  return LABEL_STATUS_BAYAR[s] ?? s;
}

const LABEL_JENIS: Record<string, string> = {
  IURAN_BULANAN: "Iuran Bulanan",
  IURAN_KEAMANAN: "Iuran Keamanan",
  IURAN_KEBERSIHAN: "Iuran Kebersihan",
  IURAN_SOSIAL: "Iuran Sosial",
  LAINNYA: "Lainnya",
};

export function labelJenis(j: string): string {
  return LABEL_JENIS[j] ?? j;
}

const NAMA_BULAN = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER",
];

// "2026-10" -> "OKTOBER 2026" (untuk kolom bulan kartu kontrol)
export function labelBulan(periode: string): string {
  const m = periode.match(/^(\d{4})-(\d{2})$/);
  if (!m) return periode;
  const idx = parseInt(m[2], 10) - 1;
  if (idx < 0 || idx > 11) return periode;
  return `${NAMA_BULAN[idx]} ${m[1]}`;
}
