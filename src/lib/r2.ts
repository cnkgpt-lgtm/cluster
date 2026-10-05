import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function r2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}

function validateFile(file: File) {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error("VALIDATION_ERROR: tipe file harus JPG, PNG, WEBP, atau PDF");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("VALIDATION_ERROR: ukuran file maksimal 5 MB");
  }
  if (file.size === 0) {
    throw new Error("VALIDATION_ERROR: file kosong");
  }
}

function extFromMime(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

import { gdriveConfigured, uploadBuktiToDrive } from "./gdrive";
import { telegramStorageConfigured, uploadBuktiToTelegram } from "./telegram-storage";

// Simpan bukti transfer; kembalikan URL publik.
// Prioritas: Cloudflare R2 → Google Drive → Telegram → data URL base64.
// Data URL adalah fallback terakhir yang selalu bekerja (termasuk di Vercel
// yang filesystem-nya read-only) bila tidak ada penyimpanan eksternal.
export async function simpanBukti(
  file: File,
  opts?: { namaFile?: string; caption?: string },
): Promise<string> {
  validateFile(file);
  const key = `bukti/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extFromMime(file.type)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (r2Configured()) {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        Body: bytes,
        ContentType: file.type,
      }),
    );
    const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    if (publicUrl) return `${publicUrl}/${key}`;
    // Tanpa domain publik, kembalikan path logis (akses via presigned URL di implementasi lanjutan)
    return `r2://${process.env.R2_BUCKET}/${key}`;
  }

  // Google Drive (service account)
  if (gdriveConfigured()) {
    try {
      return await uploadBuktiToDrive(file);
    } catch (e) {
      console.error("Upload Google Drive gagal, fallback ke data URL:", e);
    }
  }

  // Telegram (bot → channel/group pribadi; gratis, tanpa kartu kredit)
  // Nama file & caption diisi agar mudah dikenali di Telegram.
  if (telegramStorageConfigured()) {
    try {
      const untukTelegram = opts?.namaFile
        ? new File([bytes], opts.namaFile, { type: file.type })
        : new File([bytes], (file as { name?: string }).name || "bukti", { type: file.type });
      return await uploadBuktiToTelegram(untukTelegram, opts?.caption);
    } catch (e) {
      console.error("Upload Telegram gagal, fallback ke data URL:", e);
    }
  }

  // Fallback: data URL base64 (tanpa penyimpanan eksternal). Aman di serverless/Vercel.
  return `data:${file.type};base64,${bytes.toString("base64")}`;
}
