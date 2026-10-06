-- Perbaikan hasil audit keamanan run-1 (2026-10-07).
--
-- CATATAN: index anti-duplikat parsial pada pembayaran SENGAJA tidak dibuat
-- di sini — data existing (termasuk data tes) dapat memiliki beberapa
-- pembayaran aktif per tagihan sehingga CREATE UNIQUE INDEX akan gagal.
-- Duplikasi dicegah di level aplikasi via row lock FOR UPDATE pada
-- POST /api/pembayaran (serialisasi check-then-act). Index parsial dapat
-- ditambahkan kemudian setelah data didedup.

-- 1) sessionVersion di users: revokasi JWT server-side.
--    Dinaikkan setiap role/isActive/password berubah; token lama langsung mati.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- 2) Dedupe webhook Midtrans: kunci (transactionId, transactionStatus).
--    transaction_id stabil sepanjang siklus transaksi (pending -> settlement),
--    jadi dedupe hanya boleh menelan redelivery yang identik.
--    Aman: transactionId dulunya UNIQUE INDEX, sehingga pasangan
--    (transactionId, transactionStatus) pasti unik.
DROP INDEX IF EXISTS "midtrans_events_transactionId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "midtrans_events_transactionId_transactionStatus_key"
  ON "midtrans_events"("transactionId", "transactionStatus");
