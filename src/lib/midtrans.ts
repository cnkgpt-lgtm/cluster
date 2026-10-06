import crypto from "crypto";
import type { StatusPembayaran } from "./pembayaran";

export function isMockMode(): boolean {
  const mock = process.env.MOCK_PAYMENT === "true";
  // Peringatan satu-kali (hasil audit keamanan run-1): mode mock di production
  // berarti simulator pembayaran aktif untuk semua user login.
  if (mock && !warned && isProdEnv()) {
    warned = true;
    console.warn(
      "[RTKu] PERINGATAN KEAMANAN: MOCK_PAYMENT=true di production. " +
        "Matikan (unset/false) setelah kunci Midtrans produksi tersedia.",
    );
  }
  return mock;
}

let warned = false;
function isProdEnv(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

function midtransBase(): string {
  return process.env.MIDTRANS_ENV === "production"
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

export interface SnapCustomer {
  firstName: string;
  email: string;
  phone?: string;
}

export interface SnapResult {
  token: string;
  redirectUrl: string;
}

// Buat transaksi Snap Midtrans (QRIS & VA diaktifkan).
// Nominal SELALU ditentukan server dari tagihan — tidak pernah dari body client.
export async function createSnapTransaction(opts: {
  orderId: string;
  grossAmount: number;
  customer: SnapCustomer;
  itemName: string;
}): Promise<SnapResult> {
  if (isMockMode()) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return {
      token: `MOCK-${opts.orderId}`,
      redirectUrl: `${appUrl}/iuran/mock/${opts.orderId}`,
    };
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi");

  const res = await fetch(`${midtransBase()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Basic " + Buffer.from(serverKey + ":").toString("base64"),
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: opts.orderId,
        gross_amount: opts.grossAmount,
      },
      customer_details: {
        first_name: opts.customer.firstName,
        email: opts.customer.email,
        phone: opts.customer.phone ?? "",
      },
      item_details: [
        { id: opts.orderId, price: opts.grossAmount, quantity: 1, name: opts.itemName.slice(0, 50) },
      ],
      enabled_payments: ["qris", "bank_transfer"],
      callbacks: { finish: `${process.env.NEXT_PUBLIC_APP_URL}/iuran` },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Midtrans Snap gagal (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { token: string; redirect_url: string };
  return { token: data.token, redirectUrl: data.redirect_url };
}

// Verifikasi signature webhook Midtrans (fail-closed).
// signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
export function verifyWebhookSignature(opts: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false; // fail-closed: tanpa server key, semua webhook ditolak
  const expected = crypto
    .createHash("sha512")
    .update(`${opts.orderId}${opts.statusCode}${opts.grossAmount}${serverKey}`)
    .digest("hex");
  if (expected.length !== opts.signatureKey.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(opts.signatureKey));
}

// Mapping status Midtrans -> status pembayaran internal (sesuai dokumentasi resmi)
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string,
): StatusPembayaran {
  switch (transactionStatus) {
    case "capture":
      // Kartu kredit: capture + challenge -> tetap pending; accept -> paid
      return fraudStatus === "challenge" ? "PENDING" : "PAID";
    case "settlement":
      return "PAID";
    case "pending":
      return "PENDING";
    case "deny":
    case "cancel":
      return "FAILED";
    case "expire":
      return "EXPIRED";
    default:
      return "PENDING";
  }
}
