import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/notifikasi — daftar notifikasi milik sendiri; ?unread=1 -> jumlah belum dibaca
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const user = session.user as { id: string };
  const { searchParams } = new URL(req.url);

  if (searchParams.get("unread") === "1") {
    const unread = await prisma.notifikasi.count({ where: { userId: user.id, isRead: false } });
    return NextResponse.json({ unread });
  }

  const items = await prisma.notifikasi.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ items });
}

// PATCH /api/notifikasi — tandai dibaca: {all: true} atau {ids: [...]}
const patchSchema = z.object({
  all: z.boolean().optional(),
  ids: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const user = session.user as { id: string };

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  if (parsed.data.all) {
    await prisma.notifikasi.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  } else if (parsed.data.ids?.length) {
    await prisma.notifikasi.updateMany({
      where: { userId: user.id, id: { in: parsed.data.ids } },
      data: { isRead: true },
    });
  }
  return NextResponse.json({ ok: true });
}
