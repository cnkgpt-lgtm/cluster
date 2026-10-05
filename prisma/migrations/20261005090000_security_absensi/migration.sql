-- Tambah role SECURITY + tabel absensi & lokasi geofence
ALTER TYPE "Role" ADD VALUE 'SECURITY';

CREATE TABLE "absensi" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jamMasuk" TIMESTAMP(3),
    "jamPulang" TIMESTAMP(3),
    "fotoMasuk" TEXT,
    "fotoPulang" TEXT,
    "latMasuk" DOUBLE PRECISION,
    "lngMasuk" DOUBLE PRECISION,
    "latPulang" DOUBLE PRECISION,
    "lngPulang" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "absensi_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "absensi_userId_tanggal_key" ON "absensi"("userId", "tanggal");

CREATE TABLE "lokasi_absensi" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL DEFAULT 'Perumahan',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusMeter" INTEGER NOT NULL DEFAULT 200,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lokasi_absensi_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "absensi" ADD CONSTRAINT "absensi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
