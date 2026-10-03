import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH /api/cctv/[id] — ubah kamera (Pengurus)
const patchSchema = z.object({
  nama: z.string().min(2).max(80).optional(),
  lokasi: z.string().max(120).optional(),
  streamUrl: z.string().url().max(500).optional(),
  status: z.enum(["AKTIF", "NONAKTIF"]).optional(),
  urutan: z.number().int().min(0).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (role !== "PENGURUS") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const item = await prisma.kameraCctv.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!item) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/cctv/[id] — hapus kamera (Pengurus)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (role !== "PENGURUS") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  await prisma.kameraCctv.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
