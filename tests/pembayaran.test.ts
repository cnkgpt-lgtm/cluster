import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertTransition,
  statusTagihanDariPembayaran,
  perluValidasiBendahara,
} from "@/lib/pembayaran";

describe("state machine pembayaran", () => {
  it("PENDING bisa ke PAID / FAILED / EXPIRED / MENUNGGU_VALIDASI", () => {
    expect(canTransition("PENDING", "PAID")).toBe(true);
    expect(canTransition("PENDING", "FAILED")).toBe(true);
    expect(canTransition("PENDING", "EXPIRED")).toBe(true);
    expect(canTransition("PENDING", "MENUNGGU_VALIDASI")).toBe(true);
  });

  it("MENUNGGU_VALIDASI hanya bisa ke PAID / DITOLAK (validasi bendahara)", () => {
    expect(canTransition("MENUNGGU_VALIDASI", "PAID")).toBe(true);
    expect(canTransition("MENUNGGU_VALIDASI", "DITOLAK")).toBe(true);
    expect(canTransition("MENUNGGU_VALIDASI", "EXPIRED")).toBe(false);
    expect(canTransition("MENUNGGU_VALIDASI", "PENDING")).toBe(false);
  });

  it("status terminal tidak bisa berubah lagi", () => {
    for (const terminal of ["PAID", "FAILED", "EXPIRED", "DITOLAK"] as const) {
      for (const target of ["PENDING", "PAID", "FAILED", "EXPIRED", "DITOLAK", "MENUNGGU_VALIDASI"] as const) {
        expect(canTransition(terminal, target)).toBe(false);
      }
    }
  });

  it("assertTransition melempar INVALID_TRANSITION untuk transisi ilegal", () => {
    expect(() => assertTransition("PAID", "PENDING")).toThrow("INVALID_TRANSITION");
    expect(() => assertTransition("PENDING", "PAID")).not.toThrow();
  });

  it("status tagihan mengikuti status pembayaran", () => {
    expect(statusTagihanDariPembayaran("PAID")).toBe("LUNAS");
    expect(statusTagihanDariPembayaran("MENUNGGU_VALIDASI")).toBe("MENUNGGU_VALIDASI");
    expect(statusTagihanDariPembayaran("EXPIRED")).toBe("KEDALUWARSA");
    expect(statusTagihanDariPembayaran("PENDING")).toBe("BELUM_BAYAR");
    expect(statusTagihanDariPembayaran("DITOLAK")).toBe("BELUM_BAYAR");
  });

  it("hanya QRIS yang otomatis lunas; VA & transfer manual wajib validasi", () => {
    expect(perluValidasiBendahara("QRIS")).toBe(false);
    expect(perluValidasiBendahara("VA_BCA")).toBe(true);
    expect(perluValidasiBendahara("VA_BRI")).toBe(true);
    expect(perluValidasiBendahara("VA_BNI")).toBe(true);
    expect(perluValidasiBendahara("VA_MANDIRI")).toBe(true);
    expect(perluValidasiBendahara("VA_PERMATA")).toBe(true);
    expect(perluValidasiBendahara("TRANSFER_MANUAL")).toBe(true);
  });
});
