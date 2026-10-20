import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { simpanBukti } from "@/lib/r2";
import { awalHariWita, dalamRadius } from "@/lib/absensi";
import { formatTanggalWaktuWita } from "@/lib/format";

export const dynamic = "force-dynamic";

const PENGELOLA = ["PENGURUS", "BENDAHARA", "SEKRETARIS"];

// GET /api/kondisi
//   SECURITY           → foto milik sendiri (30 terbaru)
//   pengelola + ?tanggal=YYYY-MM-DD → foto semua security pada tanggal tsb (default: hari ini WITA)
export async function GET(req: NextRequest) {
  const session = await auth();
  const me = session?.user as { id?: string; role?: string } | undefined;
  if (!me?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  if (PENGELOLA.includes(me.role ?? "")) {
    const tglParam = searchParams.get("tanggal") ?? "";
    const ref = /^\d{4}-\d{2}-\d{2}$/.test(tglParam) ? new Date(`${tglParam}T12:00:00+08:00`) : new Date();
    const awal = awalHariWita(ref);
    const akhir = new Date(awal.getTime() + 24 * 3600_000);
    const daftar = await prisma.fotoKondisi.findMany({
      where: { createdAt: { gte: awal, lt: akhir } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({
      tanggal: awal.toISOString(),
      items: daftar.map((f) => ({
        id: f.id,
        nama: f.user.name,
        keterangan: f.keterangan,
        kelurahan: f.kelurahan,
        kecamatan: f.kecamatan,
        lat: f.lat,
        lng: f.lng,
        akurasi: f.akurasi,
        createdAt: f.createdAt.toISOString(),
      })),
    });
  }

  if (me.role !== "SECURITY") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const riwayat = await prisma.fotoKondisi.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({
    items: riwayat.map((f) => ({
      id: f.id,
      keterangan: f.keterangan,
      createdAt: f.createdAt.toISOString(),
    })),
  });
}

// POST /api/kondisi — kirim foto kondisi terkini cluster (khusus SECURITY)
// FormData: foto=File (sudah ada overlay tanggal/jam/lokasi), lat, lng,
//           akurasi, waktuGps (ISO), keterangan (opsional)
export async function POST(req: NextRequest) {
  const session = await auth();
  const me = session?.user as { id?: string; role?: string; name?: string } | undefined;
  if (!me?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (me.role !== "SECURITY") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const lokasi = await prisma.lokasiAbsensi.findUnique({ where: { id: "perumahan" } });
  if (!lokasi) {
    return NextResponse.json({ error: "LOKASI_BELUM_DIATUR" }, { status: 400 });
  }

  const form = await req.formData();
  const foto = form.get("foto");
  const lat = Number(form.get("lat"));
  const lng = Number(form.get("lng"));
  const akurasi = Number(form.get("akurasi"));
  const waktuGps = new Date(String(form.get("waktuGps") ?? ""));
  const keterangan = String(form.get("keterangan") ?? "").slice(0, 140).trim() || null;

  if (!(foto instanceof File) || foto.size === 0 || !foto.type.startsWith("image/")) {
    return NextResponse.json({ error: "FOTO_WAJIB" }, { status: 400 });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "LOKASI_WAJIB" }, { status: 400 });
  }

  // Foto kondisi harus diambil di dalam area cluster.
  const { diDalam, jarak } = dalamRadius(lat, lng, lokasi.latitude, lokasi.longitude, lokasi.radiusMeter);
  if (!diDalam) {
    return NextResponse.json(
      { error: "DI_LUAR_AREA", jarak, radiusMeter: lokasi.radiusMeter },
      { status: 403 },
    );
  }

  // Tolak koordinat basi.
  const umurGpsMs = Date.now() - waktuGps.getTime();
  if (!Number.isFinite(umurGpsMs) || umurGpsMs < 0 || umurGpsMs > 5 * 60_000) {
    return NextResponse.json({ error: "GPS_KADALUARSA" }, { status: 400 });
  }

  const sekarang = new Date();
  const kelurahan = lokasi.kelurahan ?? null;
  const kecamatan = lokasi.kecamatan ?? null;
  const wilayah = [lokasi.nama, kelurahan, kecamatan].filter(Boolean).join(", ");
  let refFoto: string;
  try {
    const namaBersih = (me.name ?? "security")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "security";
    refFoto = await simpanBukti(foto, {
      namaFile: `kondisi-${namaBersih}-${Date.now()}.jpg`,
      caption: [
        "📷 Foto Kondisi Cluster",
        `👤 ${me.name ?? "-"} (Security)`,
        `🕐 ${formatTanggalWaktuWita(sekarang)}`,
        `📍 ${wilayah} (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
        ...(keterangan ? [`📝 ${keterangan}`] : []),
      ].join("\n"),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UPLOAD_GAGAL";
    return NextResponse.json({ error: "UPLOAD_GAGAL", detail: msg }, { status: 400 });
  }

  const f = await prisma.fotoKondisi.create({
    data: {
      userId: me.id,
      foto: refFoto,
      keterangan,
      kelurahan, kecamatan,
      lat,
      lng,
      akurasi: Number.isFinite(akurasi) ? akurasi : null,
    },
  });
  return NextResponse.json({ ok: true, id: f.id, createdAt: f.createdAt.toISOString(), jarak });
}
