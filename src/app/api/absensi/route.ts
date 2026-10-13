import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { simpanBukti } from "@/lib/r2";
import { awalHariWita, dalamRadius, kecepatanKmh } from "@/lib/absensi";
import { formatTanggalWaktuWita } from "@/lib/format";

export const dynamic = "force-dynamic";

const REKAP_BOLEH = ["PENGURUS", "BENDAHARA", "SEKRETARIS"];

// GET /api/absensi
//   ?milik=saya            → riwayat absensi milik sendiri (SECURITY)
//   ?tanggal=YYYY-MM-DD     → rekap semua security pada tanggal tsb (pengurus/bendahara/sekretaris)
export async function GET(req: NextRequest) {
  const session = await auth();
  const me = session?.user as { id?: string; role?: string } | undefined;
  if (!me?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  // Rekap untuk pengelola
  if (REKAP_BOLEH.includes(me.role ?? "")) {
    const tglParam = searchParams.get("tanggal") ?? "";
    const ref = /^\d{4}-\d{2}-\d{2}$/.test(tglParam) ? new Date(`${tglParam}T12:00:00+08:00`) : new Date();
    const tanggal = awalHariWita(ref);
    const daftar = await prisma.user.findMany({
      where: { role: "SECURITY", isActive: true },
      select: {
        id: true,
        name: true,
        absensi: { where: { tanggal }, take: 1 },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({
      tanggal: tanggal.toISOString(),
      items: daftar.map((u) => {
        const a = u.absensi[0];
        return {
          userId: u.id,
          nama: u.name,
          jamMasuk: a?.jamMasuk?.toISOString() ?? null,
          jamPulang: a?.jamPulang?.toISOString() ?? null,
          absensiId: a?.id ?? null,
          adaFotoMasuk: !!a?.fotoMasuk,
          adaFotoPulang: !!a?.fotoPulang,
          mencurigakan: a?.mencurigakan ?? false,
          alasanCuriga: a?.alasanCuriga ?? null,
          status: !a?.jamMasuk ? "BELUM_ABSEN" : a.jamPulang ? "SELESAI" : "BERTUGAS",
        };
      }),
    });
  }

  // Riwayat milik sendiri (SECURITY)
  if (me.role !== "SECURITY") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const riwayat = await prisma.absensi.findMany({
    where: { userId: me.id },
    orderBy: { tanggal: "desc" },
    take: 30,
  });
  const hariIni = await prisma.absensi.findUnique({
    where: { userId_tanggal: { userId: me.id, tanggal: awalHariWita() } },
  });
  return NextResponse.json({
    hariIni: hariIni
      ? {
          jamMasuk: hariIni.jamMasuk?.toISOString() ?? null,
          jamPulang: hariIni.jamPulang?.toISOString() ?? null,
        }
      : null,
    riwayat: riwayat.map((a) => ({
      tanggal: a.tanggal.toISOString(),
      jamMasuk: a.jamMasuk?.toISOString() ?? null,
      jamPulang: a.jamPulang?.toISOString() ?? null,
    })),
  });
}

// POST /api/absensi — clock in / clock out (khusus SECURITY)
// FormData: tipe=masuk|pulang, foto=File (selfie wajah, wajib), lat, lng
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
  const tipe = form.get("tipe") === "pulang" ? "pulang" : "masuk";
  const foto = form.get("foto");
  const lat = Number(form.get("lat"));
  const lng = Number(form.get("lng"));
  // Data verifikasi anti fake GPS dari client
  const akurasi = Number(form.get("akurasi"));
  const waktuGps = new Date(String(form.get("waktuGps") ?? ""));
  const varianNol = String(form.get("varianNol")) === "true";

  if (!(foto instanceof File) || foto.size === 0) {
    return NextResponse.json({ error: "SELFIE_WAJIB" }, { status: 400 });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "LOKASI_WAJIB" }, { status: 400 });
  }

  // Verifikasi geofence di server — jangan percaya hitungan client saja.
  const { diDalam, jarak } = dalamRadius(lat, lng, lokasi.latitude, lokasi.longitude, lokasi.radiusMeter);
  if (!diDalam) {
    return NextResponse.json(
      { error: "DI_LUAR_AREA", jarak, radiusMeter: lokasi.radiusMeter },
      { status: 403 },
    );
  }

  const tanggal = awalHariWita();
  const sekarang = new Date();
  const kunci = { userId_tanggal: { userId: me.id, tanggal } };

  // Anti fake GPS (server): tolak koordinat basi — cegah replay koordinat lama.
  const umurGpsMs = sekarang.getTime() - waktuGps.getTime();
  if (!Number.isFinite(umurGpsMs) || umurGpsMs < 0 || umurGpsMs > 5 * 60_000) {
    return NextResponse.json({ error: "GPS_KADALUARSA" }, { status: 400 });
  }

  // Kumpulkan alasan kecurigaan (ditampilkan di rekap untuk ditinjau pengurus).
  const alasan: string[] = [];
  if (varianNol) alasan.push("Dugaan fake GPS (lokasi tidak berubah)");
  if (Number.isFinite(akurasi) && akurasi > 500) {
    alasan.push(`Akurasi GPS buruk (±${Math.round(akurasi)} m)`);
  }
  const akurasiDb = Number.isFinite(akurasi) ? akurasi : null;

  // Cek status dulu SEBELUM upload — jangan buang upload bila sudah absen.
  const ada = await prisma.absensi.findUnique({ where: kunci });
  // Record yang akan ditutup untuk tipe=pulang. Normalnya record hari ini;
  // bila shift melewati tengah malam WITA (masuk kemarin, pulang hari ini),
  // pakai shift terbuka terakhir (hasil audit keamanan run-1).
  let target = ada;
  if (tipe === "masuk" && ada?.jamMasuk) {
    return NextResponse.json(
      { error: "SUDAH_ABSEN_MASUK", jamMasuk: formatTanggalWaktuWita(ada.jamMasuk) },
      { status: 409 },
    );
  }
  if (tipe === "pulang") {
    if (!ada?.jamMasuk) {
      target = await prisma.absensi.findFirst({
        where: { userId: me.id, jamMasuk: { not: null }, jamPulang: null },
        orderBy: { tanggal: "desc" },
      });
    }
    if (!target?.jamMasuk) {
      return NextResponse.json({ error: "BELUM_ABSEN_MASUK" }, { status: 409 });
    }
    if (target.jamPulang) {
      return NextResponse.json(
        { error: "SUDAH_ABSEN_PULANG", jamPulang: formatTanggalWaktuWita(target.jamPulang) },
        { status: 409 },
      );
    }
  }

  let refFoto: string;
  try {
    // Nama file & caption Telegram: nama user, role, keterangan absen.
    const namaBersih = (me.name ?? "security")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "security";
    const ext = foto.type === "image/png" ? "png" : foto.type === "image/webp" ? "webp" : "jpg";
    refFoto = await simpanBukti(foto, {
      namaFile: `absensi-${tipe}-${namaBersih}-${Date.now()}.${ext}`,
      caption: [
        tipe === "masuk" ? "🛡️ Absen MASUK" : "🛡️ Absen PULANG",
        `👤 ${me.name ?? "-"} (Security)`,
        `🕐 ${formatTanggalWaktuWita(sekarang)}`,
        `📍 ${jarak} m dari titik`,
      ].join("\n"),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UPLOAD_GAGAL";
    return NextResponse.json({ error: "UPLOAD_GAGAL", detail: msg }, { status: 400 });
  }

  if (tipe === "masuk") {
    const flagMasuk = {
      akurasiMasuk: akurasiDb,
      mencurigakan: alasan.length > 0,
      alasanCuriga: alasan.join("; ") || null,
    };
    const a = await prisma.absensi.upsert({
      where: kunci,
      create: {
        userId: me.id, tanggal, jamMasuk: sekarang,
        fotoMasuk: refFoto, latMasuk: lat, lngMasuk: lng,
        ...flagMasuk,
      },
      update: {
        jamMasuk: sekarang, fotoMasuk: refFoto, latMasuk: lat, lngMasuk: lng,
        ...flagMasuk,
      },
    });
    return NextResponse.json({
      ok: true, tipe,
      jamMasuk: a.jamMasuk!.toISOString(), jarak,
    });
  }

  // pulang (status sudah dicek di atas sebelum upload; target bisa record
  // hari sebelumnya bila shift melewati tengah malam)
  // Anti fake GPS (server): perpindahan mustahil antara masuk & pulang.
  if (
    target?.jamMasuk && target.latMasuk != null && target.lngMasuk != null
  ) {
    const kec = kecepatanKmh(target.latMasuk, target.lngMasuk, target.jamMasuk, lat, lng, sekarang);
    if (kec != null && kec > 300) {
      alasan.push(`Perpindahan tak wajar (${Math.round(kec)} km/jam)`);
    }
  }
  const alasanGabung = [target?.alasanCuriga, ...alasan].filter(Boolean).join("; ") || null;
  const a = await prisma.absensi.update({
    where: { id: target!.id },
    data: {
      jamPulang: sekarang, fotoPulang: refFoto, latPulang: lat, lngPulang: lng,
      akurasiPulang: akurasiDb,
      mencurigakan: !!alasanGabung,
      alasanCuriga: alasanGabung,
    },
  });
  return NextResponse.json({
    ok: true, tipe,
    jamMasuk: a.jamMasuk!.toISOString(),
    jamPulang: a.jamPulang!.toISOString(), jarak,
  });
}
