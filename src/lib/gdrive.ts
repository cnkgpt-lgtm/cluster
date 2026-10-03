import { google } from "googleapis";
import { randomUUID } from "crypto";
import { Readable } from "stream";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

// Cek apakah kredensial Service Account Google Drive sudah dikonfigurasi.
// Env yang dibutuhkan:
//   GOOGLE_DRIVE_CLIENT_EMAIL  — email service account (....iam.gserviceaccount.com)
//   GOOGLE_DRIVE_PRIVATE_KEY   — private key dari file JSON service account
//   GOOGLE_DRIVE_FOLDER_ID    — ID folder Google Drive tujuan upload
export function gdriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_EMAIL &&
      process.env.GOOGLE_DRIVE_PRIVATE_KEY &&
      process.env.GOOGLE_DRIVE_FOLDER_ID
  );
}

function driveClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL!,
    // Private key di env var biasanya tersimpan dengan \n literal
    key: process.env.GOOGLE_DRIVE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });
  return google.drive({ version: "v3", auth });
}

function extFromMime(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

// Upload file bukti ke folder Google Drive dan kembalikan link lihat (webViewLink).
// File diset "siapa pun yang memiliki link dapat melihat" agar bendahara
// bisa langsung membukanya tanpa login.
export async function uploadBuktiToDrive(file: File): Promise<string> {
  const drive = driveClient();
  const name = `bukti-${new Date().toISOString().slice(0, 10)}-${randomUUID()}.${extFromMime(file.type)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const created = await drive.files.create({
    requestBody: {
      name,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      mimeType: file.type,
    },
    media: {
      mimeType: file.type,
      body: Readable.from(buffer),
    },
    fields: "id, webViewLink",
  });

  const fileId = created.data.id;
  if (!fileId) throw new Error("GDRIVE_UPLOAD_GAGAL: tidak ada file ID");

  await drive.permissions.create({
    fileId,
    requestBody: { type: "anyone", role: "reader" },
  });

  return created.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`;
}

export { isDriveLink, driveFileIdFromLink, driveThumbnailUrl } from "./gdrive-link";
