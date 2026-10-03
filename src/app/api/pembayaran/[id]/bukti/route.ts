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
    return new NextResponse(fileRes.body, {
      headers: {
        "Content-Type": fileRes.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="bukti-${id}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error("Gagal mengambil bukti dari Telegram:", e);
    return NextResponse.json({ error: "TELEGRAM_GAGAL" }, { status: 502 });
  }
}
