import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

const JENIS = ["IURAN_BULANAN", "IURAN_KEAMANAN", "IURAN_KEBERSIHAN", "IURAN_SOSIAL", "LAINNYA"] as const;

const createSchema = z.object({
  judul: z.string().min(3).max(120),
  periode: z.string().regex(/^\d{4}-\d{2}$/),
  jenis: z.enum(JENIS),
  nominal: z.number().int().min(1000).max(100_000_000),
  jatuhTempo: z.string().datetime(),
  keterangan: z.string().max(1000).optional(),
  // kosong = seluruh warga aktif
  userIds: z.array(z.string()).optional(),
});

function bolehKelola(role?: string) {
  return role === "BENDAHARA" || role === "PENGURUS";
}

// GET /api/tagihan — daftar tagihan induk
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const items = await prisma.tagihan.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: { select: { items: true } },
      dibuatOleh: { select: { name: true } },
    },
  });
  return NextResponse.json({ items });
}

// POST /api/tagihan — terbitkan tagihan ke warga (Bendahara/Pengurus)
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id: string; role?: string; name?: string } | undefined;
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!bolehKelola(user.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const d = parsed.data;

  const targets =
    d.userIds && d.userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: d.userIds }, role: "WARGA", isActive: true },
          select: { id: true },
        })
      : await prisma.user.findMany({
          where: { role: "WARGA", isActive: true },
          select: { id: true },
        });

  if (targets.length === 0) {
    return NextResponse.json({ error: "VALIDATION_ERROR", detail: "tidak ada warga target" }, { status: 400 });
  }

  const tagihan = await prisma.tagihan.create({
    data: {
      judul: d.judul,
      periode: d.periode,
      jenis: d.jenis,
      nominal: d.nominal, // nominal dihitung/disimpan di server
      jatuhTempo: new Date(d.jatuhTempo),
      keterangan: d.keterangan,
      dibuatOlehId: user.id,
      items: {
        create: targets.map((t) => ({ userId: t.id, nominal: d.nominal })),
      },
    },
  });

  // Notifikasi ke setiap warga yang ditagih
  await prisma.notifikasi.createMany({
    data: targets.map((t) => ({
      userId: t.id,
      judul: "Tagihan baru 🧾",
      pesan: `${d.judul} sebesar ${rupiah(d.nominal)}. Jatuh tempo ${new Date(d.jatuhTempo).toLocaleDateString("id-ID")}.`,
      tipe: "TAGIHAN",
      linkUrl: "/iuran",
    })),
  });

  return NextResponse.json({ ok: true, tagihan: { id: tagihan.id }, target: targets.length });
}
