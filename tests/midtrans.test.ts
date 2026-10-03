import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import { verifyWebhookSignature, mapMidtransStatus } from "@/lib/midtrans";

const SERVER_KEY = "SB-Mid-server-test-1234567890";

function signature(orderId: string, statusCode: string, grossAmount: string): string {
  return crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${SERVER_KEY}`)
    .digest("hex");
}

describe("verifikasi signature webhook Midtrans", () => {
  beforeEach(() => {
    process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
  });

  it("menerima signature yang valid", () => {
    const orderId = "RTKU-123";
    expect(
      verifyWebhookSignature({
        orderId,
        statusCode: "200",
        grossAmount: "50000",
        signatureKey: signature(orderId, "200", "50000"),
      }),
    ).toBe(true);
  });

  it("menolak signature yang salah (fail-closed)", () => {
    expect(
      verifyWebhookSignature({
        orderId: "RTKU-123",
        statusCode: "200",
        grossAmount: "50000",
        signatureKey: "salah",
      }),
    ).toBe(false);
  });

  it("menolak bila nominal diubah penyerang", () => {
    const orderId = "RTKU-123";
    expect(
      verifyWebhookSignature({
        orderId,
        statusCode: "200",
        grossAmount: "1000", // diubah dari 50000
        signatureKey: signature(orderId, "200", "50000"),
      }),
    ).toBe(false);
  });

  it("menolak semua bila server key belum dikonfigurasi (fail-closed)", () => {
    delete process.env.MIDTRANS_SERVER_KEY;
    expect(
      verifyWebhookSignature({
        orderId: "RTKU-123",
        statusCode: "200",
        grossAmount: "50000",
        signatureKey: signature("RTKU-123", "200", "50000"),
      }),
    ).toBe(false);
  });
});

describe("mapping status Midtrans", () => {
  it("capture/settlement -> PAID", () => {
    expect(mapMidtransStatus("settlement")).toBe("PAID");
    expect(mapMidtransStatus("capture", "accept")).toBe("PAID");
  });
  it("capture + challenge -> PENDING", () => {
    expect(mapMidtransStatus("capture", "challenge")).toBe("PENDING");
  });
  it("pending -> PENDING", () => {
    expect(mapMidtransStatus("pending")).toBe("PENDING");
  });
  it("deny/cancel -> FAILED", () => {
    expect(mapMidtransStatus("deny")).toBe("FAILED");
    expect(mapMidtransStatus("cancel")).toBe("FAILED");
  });
  it("expire -> EXPIRED", () => {
    expect(mapMidtransStatus("expire")).toBe("EXPIRED");
  });
});
