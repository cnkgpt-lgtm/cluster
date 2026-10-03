-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('WARGA', 'PENGURUS', 'BENDAHARA', 'SEKRETARIS');

-- CreateEnum
CREATE TYPE "JenisTagihan" AS ENUM ('IURAN_BULANAN', 'IURAN_KEAMANAN', 'IURAN_KEBERSIHAN', 'IURAN_SOSIAL', 'LAINNYA');

-- CreateEnum
CREATE TYPE "StatusTagihanWarga" AS ENUM ('BELUM_BAYAR', 'MENUNGGU_VALIDASI', 'LUNAS', 'KEDALUWARSA');

-- CreateEnum
CREATE TYPE "StatusPembayaran" AS ENUM ('PENDING', 'MENUNGGU_VALIDASI', 'PAID', 'FAILED', 'EXPIRED', 'DITOLAK');

-- CreateEnum
CREATE TYPE "MetodePembayaran" AS ENUM ('QRIS', 'VA_BCA', 'VA_BNI', 'VA_BRI', 'VA_MANDIRI', 'VA_PERMATA', 'TRANSFER_MANUAL');

-- CreateEnum
CREATE TYPE "StatusKamera" AS ENUM ('AKTIF', 'NONAKTIF');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'WARGA',
    "phone" TEXT,
    "blok" TEXT,
    "nomorRumah" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tagihan" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "jenis" "JenisTagihan" NOT NULL DEFAULT 'IURAN_BULANAN',
    "nominal" INTEGER NOT NULL,
    "jatuhTempo" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT,
    "dibuatOlehId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tagihan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tagihan_warga" (
    "id" TEXT NOT NULL,
    "tagihanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nominal" INTEGER NOT NULL,
    "status" "StatusTagihanWarga" NOT NULL DEFAULT 'BELUM_BAYAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tagihan_warga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pembayaran" (
    "id" TEXT NOT NULL,
    "tagihanWargaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metode" "MetodePembayaran" NOT NULL,
    "nominal" INTEGER NOT NULL,
    "status" "StatusPembayaran" NOT NULL DEFAULT 'PENDING',
    "midtransOrderId" TEXT,
    "snapToken" TEXT,
    "buktiUrl" TEXT,
    "catatan" TEXT,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "midtrans_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "transactionStatus" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "midtrans_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengumuman" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'UMUM',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "dibuatOlehId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengumuman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kamera_cctv" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "lokasi" TEXT,
    "streamUrl" TEXT NOT NULL,
    "status" "StatusKamera" NOT NULL DEFAULT 'AKTIF',
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kamera_cctv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifikasi" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "tipe" TEXT NOT NULL DEFAULT 'INFO',
    "linkUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengeluaran_kas" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'OPERASIONAL',
    "nominal" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keterangan" TEXT,
    "buktiUrl" TEXT,
    "dicatatOlehId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengeluaran_kas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tagihan_warga_tagihanId_userId_key" ON "tagihan_warga"("tagihanId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "pembayaran_midtransOrderId_key" ON "pembayaran"("midtransOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "midtrans_events_transactionId_key" ON "midtrans_events"("transactionId");

-- AddForeignKey
ALTER TABLE "tagihan" ADD CONSTRAINT "tagihan_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tagihan_warga" ADD CONSTRAINT "tagihan_warga_tagihanId_fkey" FOREIGN KEY ("tagihanId") REFERENCES "tagihan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tagihan_warga" ADD CONSTRAINT "tagihan_warga_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_tagihanWargaId_fkey" FOREIGN KEY ("tagihanWargaId") REFERENCES "tagihan_warga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengumuman" ADD CONSTRAINT "pengumuman_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengeluaran_kas" ADD CONSTRAINT "pengeluaran_kas_dicatatOlehId_fkey" FOREIGN KEY ("dicatatOlehId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

