import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/profil — profil milik sendiri
export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profil = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, phone: true, alamat: true, blok: true, nomorRumah: true },
  });
  if (!profil) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ profil });
}

const profilSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100).optional(),
  phone: z.string().max(20).optional(),
  alamat: z.string().max(300).optional(),
  blok: z.string().max(10).optional(),
  nomorRumah: z.string().max(10).optional(),
});

// PATCH /api/profil — ubah identitas sendiri
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = profilSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) data[k] = v.trim();
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "TIDAK_ADA_PERUBAHAN" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
}
