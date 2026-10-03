import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { r2Configured } from "@/lib/r2";
import { gdriveConfigured } from "@/lib/gdrive";
import { telegramStorageConfigured } from "@/lib/telegram-storage";

export const dynamic = "force-dynamic";

// GET /api/storage/status — backend penyimpanan bukti transfer yang sedang aktif.
// Hanya info boolean (tidak membocorkan secret). Untuk Bendahara/Pengurus.
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (role !== "BENDAHARA" && role !== "PENGURUS") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const r2 = r2Configured();
  const googleDrive = gdriveConfigured();
  const telegram = telegramStorageConfigured();
  const aktif = r2 ? "R2" : googleDrive ? "GOOGLE_DRIVE" : telegram ? "TELEGRAM" : "DATABASE";

  return NextResponse.json({ aktif, detail: { r2, googleDrive, telegram } });
}
