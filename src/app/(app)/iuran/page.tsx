import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rupiah, formatTanggalWita, labelJenis } from "@/lib/format";
import { Card, badgeStatusBayar, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function IuranPage() {
  const session = await auth();
  const user = session!.user as { id: string };

  const tagihan = await prisma.tagihanWarga.findMany({
    where: { userId: user.id },
    include: { tagihan: true, pembayaran: { orderBy: { createdAt: "desc" } } },
    orderBy: [{ status: "asc" }, { tagihan: { jatuhTempo: "asc" } }],
  });

  const aktif = tagihan.filter((t) => t.status === "BELUM_BAYAR");
  const lainnya = tagihan.filter((t) => t.status !== "BELUM_BAYAR");

  return (
    <div className="anim-stagger space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Iuran Saya</h1>
        <p className="text-sm text-slate-500">Bayar iuran via QRIS, Virtual Account, atau transfer manual.</p>
      </div>

      <Card title={`Perlu Dibayar (${aktif.length})`}>
        {aktif.length === 0 ? (
          <Empty icon="🎉" title="Tidak ada tagihan aktif" sub="Semua iuran Anda sudah lunas." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {aktif.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold text-slate-800">{t.tagihan.judul}</p>
                  <p className="text-xs text-slate-500">
                    {labelJenis(t.tagihan.jenis)} · Jatuh tempo {formatTanggalWita(t.tagihan.jatuhTempo)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-extrabold text-slate-900">{rupiah(t.nominal)}</span>
                  <Link
                    href={`/iuran/${t.id}`}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    Bayar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Riwayat">
        {lainnya.length === 0 ? (
          <Empty icon="📭" title="Belum ada riwayat" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {lainnya.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold text-slate-800">{t.tagihan.judul}</p>
                  <p className="text-xs text-slate-500">
                    {t.pembayaran[0]
                      ? `${t.pembayaran[0].metode.replace(/_/g, " ")} · ${formatTanggalWita(t.pembayaran[0].createdAt)}`
                      : labelJenis(t.tagihan.jenis)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {badgeStatusBayar(t.status)}
                  <span className="font-bold text-slate-900">{rupiah(t.nominal)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
