import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/warga — direktori warga (semua peran bisa melihat info dasar)
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const items = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: [{ blok: "asc" }, { nomorRumah: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      role: true,
      blok: true,
      nomorRumah: true,
      phone: true,
    },
  });
  return NextResponse.json({ items });
}
