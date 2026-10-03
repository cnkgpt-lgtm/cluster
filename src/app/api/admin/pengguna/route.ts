import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/admin/pengguna — kelola pengguna (Pengurus)
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (role !== "PENGURUS") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const items = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, blok: true, nomorRumah: true, phone: true, isActive: true, createdAt: true },
  });
  return NextResponse.json({ items });
}

const createSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(["WARGA", "PENGURUS", "BENDAHARA", "SEKRETARIS"]),
  blok: z.string().max(10).optional(),
  nomorRumah: z.string().max(10).optional(),
  phone: z.string().max(20).optional(),
});

// POST /api/admin/pengguna — tambah pengguna (Pengurus)
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (role !== "PENGURUS") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const ada = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (ada) return NextResponse.json({ error: "EMAIL_SUDAH_TERDAFTAR" }, { status: 400 });

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role: parsed.data.role,
      blok: parsed.data.blok,
      nomorRumah: parsed.data.nomorRumah,
      phone: parsed.data.phone,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: user.id });
}
