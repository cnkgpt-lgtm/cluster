-- Anti fake GPS: simpan akurasi + penanda kecurigaan pada absensi
ALTER TABLE "absensi" ADD COLUMN "akurasiMasuk" DOUBLE PRECISION;
ALTER TABLE "absensi" ADD COLUMN "akurasiPulang" DOUBLE PRECISION;
ALTER TABLE "absensi" ADD COLUMN "mencurigakan" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "absensi" ADD COLUMN "alasanCuriga" TEXT;
