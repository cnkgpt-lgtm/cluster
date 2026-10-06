import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature, mapMidtransStatus } from "@/lib/midtrans";
import { prosesHasilPembayaran } from "@/lib/pembayaran-service";
import type { StatusPembayaran } from "@/lib/pembayaran";

export const dynamic = "force-dynamic";

// Webhook Midtrans: verifikasi signature (fail-closed) -> validasi order/nominal
// -> dedupe -> map status -> terapkan.
// Idempoten: redelivery notifikasi yang identik (transaction_id + status sama)
// tidak mengubah state dua kali. Perubahan status yang sah (pending -> settlement)
// memakai transaction_id yang sama sehingga TIDAK boleh ditelan dedupe.
const webhookSchema = z.object({
  order_id: z.string(),
  status_code: z.string(),
  gross_amount: z.string(),
  signature_key: z.string(),
  transaction_id: z.string(),
  transaction_status: z.string(),
  fraud_status: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }
  const p = parsed.data;

  // 1) Verifikasi signature — fail-closed, TANPA pengecualian mode mock
  //    (hasil audit keamanan run-1: cabang "mock-signature" dihapus; alur
  //    simulasi memakai /api/dev/simulate yang terautentikasi, bukan webhook ini).
  const valid = verifyWebhookSignature({
    orderId: p.order_id,
    statusCode: p.status_code,
    grossAmount: p.gross_amount,
    signatureKey: p.signature_key,
  });
  if (!valid) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  // 2) Cari pembayaran
  const pembayaran = await prisma.pembayaran.findUnique({
    where: { midtransOrderId: p.order_id },
  });
  if (!pembayaran) {
    return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  }

  // 3) Verifikasi nominal sesuai catatan server
  if (Number(p.gross_amount) !== pembayaran.nominal) {
    return NextResponse.json({ error: "AMOUNT_MISMATCH" }, { status: 400 });
  }

  // 4) Dedupe SETELAH validasi (hasil audit run-1): notifikasi yang ditolak
  //    validasi tidak boleh meracuni kunci idempotensi.
  try {
    await prisma.midtransEvent.create({
      data: {
        orderId: p.order_id,
        transactionId: p.transaction_id,
        transactionStatus: p.transaction_status,
        rawPayload: p as object,
      },
    });
  } catch {
    // Redelivery notifikasi identik -> idempoten
    return NextResponse.json({ ok: true, deduped: true });
  }

  // 5) Map status & terapkan transisi
  const statusBaru: StatusPembayaran = mapMidtransStatus(p.transaction_status, p.fraud_status);
  try {
    await prosesHasilPembayaran(pembayaran.id, statusBaru);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    if (msg.startsWith("INVALID_TRANSITION") || msg === "CONCURRENT_CONFLICT") {
      // Event terlambat/tertunda untuk state terminal, atau race antar
      // notifikasi konkuren -> abaikan dengan aman
      return NextResponse.json({ ok: true, ignored: msg });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
