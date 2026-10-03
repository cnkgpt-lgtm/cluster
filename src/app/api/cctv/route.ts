import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const schema = z.object({
  nama: z.string().min(2).max(80),
  lokasi: z.string().max(120).optional(),
  streamUrl: z.string().url("URL stream tidak valid").max(500),
  status: z.enum(["AKTIF", "NONAKTIF"]).default("AKTIF"),
  urutan: z.number().int().min(0).default(0),
});

function bolehKelola(role?: string) {
  return role === "PENGURUS";
}

// GET /api/cctv — semua warga bisa melihat daftar kamera
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const items = await prisma.kameraCctv.findMany({ orderBy: [{ urutan: "asc" }, { nama: "asc" }] });
  return NextResponse.json({ items });
}

// POST /api/cctv — tambah kamera (Pengurus)
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id: string; role?: string } | undefined;
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!bolehKelola(user.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const item = await prisma.kameraCctv.create({ data: parsed.data });
  return NextResponse.json({ ok: true, item: { id: item.id } });
}
