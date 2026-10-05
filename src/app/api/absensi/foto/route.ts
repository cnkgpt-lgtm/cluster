import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  isTelegramFileRef,
  telegramFileIdFromRef,
  telegramDirectDownloadUrl,
  telegramStorageConfigured,
} from "@/lib/telegram-storage";

export const dynamic = "force-dynamic";

const BOLEH = ["PENGURUS", "BENDAHARA", "SEKRETARIS"];

function sniff(buf: Uint8Array): string {
  const h = (i: number) => buf[i];
  if (h(0) === 0x89 && h(1) === 0x50 && h(2) === 0x4e && h(3) === 0x47) return "image/png";
  if (h(0) === 0xff && h(1) === 0xd8 && h(2) === 0xff) return "image/jpeg";
  if (h(0) === 0x52 && h(1) === 0x49 && h(2) === 0x46 && h(3) === 0x46 &&
      h(8) === 0x57 && h(9) === 0x45 && h(10) === 0x42 && h(11) === 0x50) return "image/webp";
  return "application/octet-stream";
}

// GET /api/absensi/foto?id=<absensiId>&tipe=masuk|pulang
// Selfie hanya boleh dilihat pengelola atau pemiliknya sendiri.
export async function GET(req: NextRequest) {
  const session = await auth();
  const me = session?.user as { id?: string; role?: string } | undefined;
  if (!me?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? "";
  const tipe = searchParams.get("tipe") === "pulang" ? "fotoPulang" : "fotoMasuk";

  const a = await prisma.absensi.findUnique({
    where: { id },
    select: { userId: true, fotoMasuk: true, fotoPulang: true },
  });
  if (!a) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const pemilik = a.userId === me.id;
  if (!pemilik && !BOLEH.includes(me.role ?? "")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const ref = tipe === "fotoPulang" ? a.fotoPulang : a.fotoMasuk;
  if (!ref || !isTelegramFileRef(ref) || !telegramStorageConfigured()) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const url = await telegramDirectDownloadUrl(telegramFileIdFromRef(ref));
    const res = await fetch(url);
    if (!res.ok || !res.body) {
      return NextResponse.json({ error: "TELEGRAM_UNDUH_GAGAL" }, { status: 502 });
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return new NextResponse(buf, {
      headers: {
        "Content-Type": sniff(buf),
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "TELEGRAM_UNDUH_GAGAL" }, { status: 502 });
  }
}
