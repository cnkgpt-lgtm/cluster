import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createSnapTransaction, isMockMode } from "@/lib/midtrans";
import { simpanBukti } from "@/lib/r2";
import { rupiah, labelMetode, formatTanggalWaktuWita } from "@/lib/format";

export const dynamic = "force-dynamic";

const METODE_ONLINE = ["QRIS", "VA_BCA", "VA_BNI", "VA_BRI", "VA_MANDIRI", "VA_PERMATA"] as const;

const jsonSchema = z.object({
  tagihanWargaId: z.string().min(1),
  // JSON hanya untuk QRIS (otomatis). VA & transfer manual lewat FormData + bukti.
  metode: z.literal("QRIS"),
});

// POST /api/pembayaran
// - JSON {tagihanWargaId, metode: QRIS} -> buat transaksi Midtrans (Snap)
// - FormData {tagihanWargaId, metode: TRANSFER_MANUAL|VA_*, bukti: File} -> bukti + validasi bendahara
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const user = session.user as { id: string; name: string; email: string };

  const contentType = req.headers.get("content-type") ?? "";
  let tagihanWargaId: string;
  let metode: string;
  let buktiFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    tagihanWargaId = String(form.get("tagihanWargaId") ?? "");
    metode = String(form.get("metode") ?? "");
    const f = form.get("bukti");
    if (f instanceof File) buktiFile = f;
  } else {
    const parsed = jsonSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
    tagihanWargaId = parsed.data.tagihanWargaId;
    metode = parsed.data.metode;
  }

  if (metode !== "TRANSFER_MANUAL" && !(METODE_ONLINE as readonly string[]).includes(metode)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", detail: "metode tidak dikenal" }, { status: 400 });
  }

  // Verifikasi kepemilikan & status tagihan (server-side)
  const tw = await prisma.tagihanWarga.findUnique({
    where: { id: tagihanWargaId },
    include: { tagihan: true },
  });
  if (!tw || tw.userId !== user.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (tw.status !== "BELUM_BAYAR") {
    return NextResponse.json({ error: "TAGIHAN_TIDAK_AKTIF", status: tw.status }, { status: 400 });
  }

  // Nominal selalu dari server
  const nominal = tw.nominal;

  // ---- Transfer manual & VA: wajib bukti, menunggu validasi bendahara ----
  if (metode === "TRANSFER_MANUAL" || metode.startsWith("VA_")) {
    if (!buktiFile) {
      return NextResponse.json({ error: "VALIDATION_ERROR", detail: "bukti transfer wajib diunggah" }, { status: 400 });
    }
    let buktiUrl: string;
    try {
      // Nama file & caption Telegram: nama user, role, keterangan tagihan.
      const pemilik = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, role: true },
      });
      const labelRole: Record<string, string> = {
        WARGA: "Warga", PENGURUS: "Pengurus", BENDAHARA: "Bendahara",
        SEKRETARIS: "Sekretaris", SECURITY: "Security",
      };
      const namaBersih = (pemilik?.name ?? user.name ?? "warga")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "warga";
      const ext = buktiFile.type === "image/png" ? "png"
        : buktiFile.type === "image/webp" ? "webp"
        : buktiFile.type === "application/pdf" ? "pdf" : "jpg";
      buktiUrl = await simpanBukti(buktiFile, {
        namaFile: `bukti-${namaBersih}-${Date.now()}.${ext}`,
        caption: [
          "💳 Bukti pembayaran",
          `👤 ${pemilik?.name ?? user.name} (${labelRole[pemilik?.role ?? ""] ?? pemilik?.role ?? "-"})`,
          `🧾 ${tw.tagihan.judul} — ${rupiah(nominal)}`,
          `🏦 ${labelMetode(metode)}`,
          `🕐 ${formatTanggalWaktuWita(new Date())}`,
        ].join("\n"),
      });
    } catch (e) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", detail: e instanceof Error ? e.message : "upload gagal" },
        { status: 400 },
      );
    }
    const pembayaran = await prisma.pembayaran.create({
      data: {
        tagihanWargaId: tw.id,
        userId: user.id,
        metode: metode as "TRANSFER_MANUAL" | "VA_BCA" | "VA_BNI" | "VA_BRI" | "VA_MANDIRI" | "VA_PERMATA",
        nominal,
        status: "MENUNGGU_VALIDASI",
        buktiUrl,
      },
    });
    await prisma.tagihanWarga.update({ where: { id: tw.id }, data: { status: "MENUNGGU_VALIDASI" } });
    // Notifikasi ke bendahara agar segera divalidasi
    const { kirimNotifikasiKeRole } = await import("@/lib/notifikasi");
    await kirimNotifikasiKeRole("BENDAHARA", {
      judul: "Bukti transfer perlu divalidasi",
      pesan: `${user.name} mengunggah bukti ${tw.tagihan.judul} (${rupiah(nominal)}).`,
      tipe: "VALIDASI",
      linkUrl: "/validasi",
    });
    return NextResponse.json({ ok: true, pembayaran: { id: pembayaran.id, status: pembayaran.status } });
  }

  // ---- Online (QRIS): pakai ulang transaksi PENDING yang masih hidup ----
  // Catatan: VA kini lewat alur bukti di atas, sehingga di sini hanya QRIS.
  const existing = await prisma.pembayaran.findFirst({
    where: { tagihanWargaId: tw.id, status: "PENDING", midtransOrderId: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  if (existing?.snapToken) {
    return NextResponse.json({
      ok: true,
      pembayaranId: existing.id,
      orderId: existing.midtransOrderId,
      snapToken: existing.snapToken,
      snapScriptUrl:
        process.env.MIDTRANS_ENV === "production"
          ? "https://app.midtrans.com/snap/snap.js"
          : "https://app.sandbox.midtrans.com/snap/snap.js",
      clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
      mock: isMockMode(),
    });
  }

  const orderId = `RTKU-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const snap = await createSnapTransaction({
    orderId,
    grossAmount: nominal,
    customer: { firstName: user.name, email: user.email },
    itemName: tw.tagihan.judul,
  });

  const pembayaran = await prisma.pembayaran.create({
    data: {
      tagihanWargaId: tw.id,
      userId: user.id,
      metode: metode as (typeof METODE_ONLINE)[number],
      nominal,
      status: "PENDING",
      midtransOrderId: orderId,
      snapToken: snap.token,
    },
  });

  return NextResponse.json({
    ok: true,
    pembayaranId: pembayaran.id,
    orderId,
    snapToken: snap.token,
    redirectUrl: snap.redirectUrl,
    snapScriptUrl:
      process.env.MIDTRANS_ENV === "production"
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js",
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
    mock: isMockMode(),
  });
}

// GET /api/pembayaran?mine=1 — riwayat pembayaran milik sendiri
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const user = session.user as { id: string; role: string };
  const { searchParams } = new URL(req.url);

  const where =
    searchParams.get("all") === "1" && (user.role === "BENDAHARA" || user.role === "PENGURUS")
      ? {}
      : { userId: user.id };

  const items = await prisma.pembayaran.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true } },
      tagihanWarga: { include: { tagihan: { select: { judul: true, periode: true } } } },
    },
  });
  return NextResponse.json({ items });
}
