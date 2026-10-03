import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/tagihan-warga?mine=1 — tagihan milik sendiri (warga)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const user = session.user as { id: string; role: string };
  const { searchParams } = new URL(req.url);

  const where =
    searchParams.get("all") === "1" && (user.role === "BENDAHARA" || user.role === "PENGURUS")
      ? {}
      : { userId: user.id };

  const items = await prisma.tagihanWarga.findMany({
    where,
    orderBy: [{ status: "asc" }, { tagihan: { jatuhTempo: "asc" } }],
    take: 200,
    include: {
      tagihan: true,
      user: { select: { name: true, blok: true, nomorRumah: true } },
      pembayaran: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  return NextResponse.json({ items });
}
