-- Perbaikan hasil audit keamanan run-1 (2026-10-07).

-- 1) sessionVersion di users: revokasi JWT server-side.
--    Dinaikkan setiap role/isActive/password berubah; token lama langsung mati.
ALTER TABLE "users" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- 2) Dedupe webhook Midtrans: kunci (transactionId, transactionStatus).
--    transaction_id stabil sepanjang siklus transaksi (pending -> settlement),
--    jadi dedupe hanya boleh menelan redelivery yang identik.
--    Aman: transactionId dulunya UNIQUE, sehingga pasangan (transactionId, transactionStatus)
--    pasti unik dan migrasi tidak akan gagal karena duplikat.
ALTER TABLE "midtrans_events" DROP CONSTRAINT "midtrans_events_transactionId_key";
ALTER TABLE "midtrans_events" ADD CONSTRAINT "midtrans_events_transactionId_transactionStatus_key" UNIQUE ("transactionId", "transactionStatus");

-- 3) Anti-duplikat pembayaran aktif: satu tagihan hanya boleh punya SATU
--    pembayaran berstatus PENDING/MENUNGGU_VALIDASI dalam satu waktu.
--    Menutup race check-then-act pada POST /api/pembayaran.
CREATE UNIQUE INDEX "pembayaran_tagihanWargaId_aktif_key"
  ON "pembayaran"("tagihanWargaId")
  WHERE "status" IN ('PENDING', 'MENUNGGU_VALIDASI');
