import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  isTelegramFileRef,
  telegramFileIdFromRef,
  telegramDirectDownloadUrl,
  telegramStorageConfigured,
} from "@/lib/telegram-storage";

export const dynamic = "force-dynamic";

// Deteksi tipe file dari magic bytes — Telegram selalu mengirim
// application/octet-stream sehingga browser mengunduh, bukan menampilkan.
function sniffContentType(buf: Uint8Array): { type: string; ext: string } | null {
  const h = (i: number) => buf[i];
  if (h(0) === 0x89 && h(1) === 0x50 && h(2) === 0x4e && h(3) === 0x47)
    return { type: "image/png", ext: "png" };
  if (h(0) === 0xff && h(1) === 0xd8 && h(2) === 0xff)
    return { type: "image/jpeg", ext: "jpg" };
  if (
    h(0) === 0x52 && h(1) === 0x49 && h(2) === 0x46 && h(3) === 0x46 &&
    h(8) === 0x57 && h(9) === 0x45 && h(10) === 0x42 && h(11) === 0x50
  )
    return { type: "image/webp", ext: "webp" };
  if (h(0) === 0x25 && h(1) === 0x50 && h(2) === 0x44 && h(3) === 0x46)
    return { type: "application/pdf", ext: "pdf" };
  return null;
}

// GET /api/pembayaran/[id]/bukti — tampilkan/unduh bukti transfer yang tersimpan
// di Telegram. Hanya Bendahara/Pengurus. Token bot tetap di server.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (role !== "BENDAHARA" && role !== "PENGURUS") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (!telegramStorageConfigured()) {
    return NextResponse.json({ error: "TELEGRAM_TIDAK_DIKONFIGURASI" }, { status: 400 });
  }

  const { id } = await params;
  const p = await prisma.pembayaran.findUnique({
    where: { id },
    select: { buktiUrl: true },
  });
  if (!p?.buktiUrl || !isTelegramFileRef(p.buktiUrl)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const downloadUrl = await telegramDirectDownloadUrl(telegramFileIdFromRef(p.buktiUrl));
    const fileRes = await fetch(downloadUrl);
    if (!fileRes.ok || !fileRes.body) {
      return NextResponse.json({ error: "TELEGRAM_UNDUH_GAGAL" }, { status: 502 });
    }
    // Baca ke buffer agar bisa deteksi tipe asli file (untuk tampil inline).
    const bytes = new Uint8Array(await fileRes.arrayBuffer());
    const sniffed = sniffContentType(bytes);
    const contentType =
      sniffed?.type ?? fileRes.headers.get("content-type") ?? "application/octet-stream";
    const filename = `bukti-${id}${sniffed ? `.${sniffed.ext}` : ""}`;
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error("Gagal mengambil bukti dari Telegram:", e);
    return NextResponse.json({ error: "TELEGRAM_GAGAL" }, { status: 502 });
  }
}
