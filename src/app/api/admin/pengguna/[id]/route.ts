import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH /api/admin/pengguna/[id] — ubah role / status aktif (Pengurus)
const schema = z.object({
  role: z.enum(["WARGA", "PENGURUS", "BENDAHARA", "SEKRETARIS"]).optional(),
  isActive: z.boolean().optional(),
  blok: z.string().max(10).optional(),
  nomorRumah: z.string().max(10).optional(),
  phone: z.string().max(20).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const me = session?.user as { id: string; role?: string } | undefined;
  if (!me) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (me.role !== "PENGURUS") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  if (id === me.id) return NextResponse.json({ error: "TIDAK_BOLEH_UBAH_DIRI_SENDIRI" }, { status: 400 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const user = await prisma.user.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
