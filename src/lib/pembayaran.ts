// State machine pembayaran.
// Transisi yang sah (fail-closed: selain ini ditolak):
//   PENDING -> PAID | FAILED | EXPIRED | MENUNGGU_VALIDASI
//   MENUNGGU_VALIDASI -> PAID | DITOLAK   (validasi bendahara)
//   PAID, FAILED, EXPIRED, DITOLAK = terminal
export type StatusPembayaran =
  | "PENDING"
  | "MENUNGGU_VALIDASI"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "DITOLAK";

const ALLOWED: Record<StatusPembayaran, StatusPembayaran[]> = {
  PENDING: ["PAID", "FAILED", "EXPIRED", "MENUNGGU_VALIDASI"],
  MENUNGGU_VALIDASI: ["PAID", "DITOLAK"],
  PAID: [],
  FAILED: [],
  EXPIRED: [],
  DITOLAK: [],
};

export function canTransition(from: StatusPembayaran, to: StatusPembayaran): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertTransition(from: StatusPembayaran, to: StatusPembayaran): void {
  if (!canTransition(from, to)) {
    throw new Error(`INVALID_TRANSITION: ${from} -> ${to}`);
  }
}

// Status tagihan warga mengikuti pembayaran
export function statusTagihanDariPembayaran(
  statusBayar: StatusPembayaran,
): "BELUM_BAYAR" | "MENUNGGU_VALIDASI" | "LUNAS" | "KEDALUWARSA" {
  switch (statusBayar) {
    case "PAID":
      return "LUNAS";
    case "MENUNGGU_VALIDASI":
      return "MENUNGGU_VALIDASI";
    case "EXPIRED":
      return "KEDALUWARSA";
    default:
      return "BELUM_BAYAR";
  }
}
