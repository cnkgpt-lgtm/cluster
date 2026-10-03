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

// Simpan bukti transfer; kembalikan URL publik.
// Pakai Cloudflare R2 bila dikonfigurasi. Jika tidak, simpan sebagai data URL
// base64 di database — cara ini otomatis bekerja di Vercel (filesystem read-only)
// maupun di development lokal tanpa perlu folder uploads.
export async function simpanBukti(file: File): Promise<string> {
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

  // Fallback: data URL base64 (tanpa R2). Aman di serverless/Vercel.
  return `data:${file.type};base64,${bytes.toString("base64")}`;
}
