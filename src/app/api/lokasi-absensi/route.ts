import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/lokasi-absensi — baca titik & radius geofence (semua role login)
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const l = await prisma.lokasiAbsensi.findUnique({ where: { id: "perumahan" } });
  return NextResponse.json({
    diatur: !!l,
    lokasi: l
      ? { nama: l.nama, latitude: l.latitude, longitude: l.longitude, radiusMeter: l.radiusMeter }
      : null,
  });
}

// DELETE /api/lokasi-absensi — hapus titik (khusus PENGURUS)
export async function DELETE() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (role !== "PENGURUS") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  await prisma.lokasiAbsensi.deleteMany({ where: { id: "perumahan" } });
  return NextResponse.json({ ok: true });
}
export async function PUT(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (role !== "PENGURUS") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    nama?: string; latitude?: number; longitude?: number; radiusMeter?: number;
  } | null;
  const lat = Number(body?.latitude);
  const lng = Number(body?.longitude);
  const radius = Math.round(Number(body?.radiusMeter));
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ error: "LATITUDE_TIDAK_VALID" }, { status: 400 });
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "LONGITUDE_TIDAK_VALID" }, { status: 400 });
  }
  if (!Number.isFinite(radius) || radius < 25 || radius > 5000) {
    return NextResponse.json({ error: "RADIUS_TIDAK_VALID" }, { status: 400 });
  }

  const l = await prisma.lokasiAbsensi.upsert({
    where: { id: "perumahan" },
    create: {
      id: "perumahan",
      nama: (body?.nama ?? "Perumahan").toString().slice(0, 80) || "Perumahan",
      latitude: lat, longitude: lng, radiusMeter: radius,
    },
    update: {
      nama: (body?.nama ?? "Perumahan").toString().slice(0, 80) || "Perumahan",
      latitude: lat, longitude: lng, radiusMeter: radius,
    },
  });
  return NextResponse.json({
    ok: true,
    lokasi: { nama: l.nama, latitude: l.latitude, longitude: l.longitude, radiusMeter: l.radiusMeter },
  });
}
