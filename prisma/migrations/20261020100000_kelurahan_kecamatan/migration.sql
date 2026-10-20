-- Kelurahan & kecamatan pada titik lokasi + snapshot pada foto kondisi
ALTER TABLE "lokasi_absensi" ADD COLUMN "kelurahan" TEXT;
ALTER TABLE "lokasi_absensi" ADD COLUMN "kecamatan" TEXT;
ALTER TABLE "foto_kondisi" ADD COLUMN "kelurahan" TEXT;
ALTER TABLE "foto_kondisi" ADD COLUMN "kecamatan" TEXT;
