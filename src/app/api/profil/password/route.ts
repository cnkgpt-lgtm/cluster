import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const passwordSchema = z.object({
  saatIni: z.string().min(1, "Kata sandi saat ini wajib diisi"),
  baru: z.string().min(6, "Kata sandi baru minimal 6 karakter").max(100),
});

// POST /api/profil/password — ganti kata sandi sendiri
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = passwordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!dbUser) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const cocok = await bcrypt.compare(parsed.data.saatIni, dbUser.passwordHash);
  if (!cocok) return NextResponse.json({ error: "Kata sandi saat ini salah." }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.baru, 10) },
  });
  return NextResponse.json({ ok: true });
}
