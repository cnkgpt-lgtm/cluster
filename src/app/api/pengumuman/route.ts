import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { kirimNotifikasiKeRole } from "@/lib/notifikasi";

export const dynamic = "force-dynamic";

function bolehKelola(role?: string) {
  return role === "PENGURUS" || role === "SEKRETARIS";
}

const createSchema = z.object({
  judul: z.string().min(3).max(150),
  isi: z.string().min(10).max(20000),
  kategori: z.string().max(40).default("UMUM"),
  isPublished: z.boolean().default(true),
});

// GET /api/pengumuman — daftar pengumuman tayang
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const items = await prisma.pengumuman.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { dibuatOleh: { select: { name: true, role: true } } },
  });
  return NextResponse.json({ items });
}

// POST /api/pengumuman — buat pengumuman (Pengurus/Sekretaris)
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id: string; role?: string; name?: string } | undefined;
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!bolehKelola(user.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const item = await prisma.pengumuman.create({
    data: { ...parsed.data, dibuatOlehId: user.id },
  });

  if (item.isPublished) {
    await kirimNotifikasiKeRole("WARGA", {
      judul: `Pengumuman: ${item.judul}`,
      pesan: item.isi.slice(0, 140) + (item.isi.length > 140 ? "…" : ""),
      tipe: "PENGUMUMAN",
      linkUrl: `/pengumuman/${item.id}`,
    });
  }

  return NextResponse.json({ ok: true, item: { id: item.id } });
}
