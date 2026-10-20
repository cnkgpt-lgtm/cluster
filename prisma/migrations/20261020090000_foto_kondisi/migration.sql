-- Foto kondisi terkini cluster oleh security (patroli)
CREATE TABLE "foto_kondisi" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "foto" TEXT NOT NULL,
  "keterangan" TEXT,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "akurasi" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "foto_kondisi_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "foto_kondisi_createdAt_idx" ON "foto_kondisi"("createdAt");
ALTER TABLE "foto_kondisi" ADD CONSTRAINT "foto_kondisi_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
