import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rupiah, formatTanggalWita, labelJenis } from "@/lib/format";
import { Card } from "@/components/ui";
import BayarForm from "@/components/BayarForm";

export const dynamic = "force-dynamic";

export default async function BayarPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as { id: string };
  const { id } = await params;

  const tw = await prisma.tagihanWarga.findUnique({
    where: { id },
    include: { tagihan: true },
  });
  if (!tw || tw.userId !== user.id) notFound();

  return (
    <div className="anim-fade-up mx-auto max-w-2xl space-y-6">
      <Link href="/iuran" className="text-sm font-semibold text-emerald-700 hover:underline">
        ← Kembali ke Iuran
      </Link>

      <Card title="Rincian Tagihan">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Tagihan</dt>
            <dd className="font-semibold text-slate-800">{tw.tagihan.judul}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Jenis</dt>
            <dd className="font-semibold text-slate-800">{labelJenis(tw.tagihan.jenis)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Jatuh tempo</dt>
            <dd className="font-semibold text-slate-800">{formatTanggalWita(tw.tagihan.jatuhTempo)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2">
            <dt className="font-semibold text-slate-700">Total bayar</dt>
            <dd className="text-xl font-extrabold text-emerald-700">{rupiah(tw.nominal)}</dd>
          </div>
        </dl>
      </Card>

      {tw.status === "BELUM_BAYAR" ? (
        <Card title="Pembayaran">
          <BayarForm tagihanWargaId={tw.id} nominal={tw.nominal} />
        </Card>
      ) : tw.status === "MENUNGGU_VALIDASI" ? (
        <Card title="Status Pembayaran">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⏳ Pembayaran Anda <b>sedang diverifikasi oleh bendahara</b>. Tagihan ini akan
            berstatus <b>Lunas</b> setelah divalidasi. Tidak perlu membayar ulang.
          </div>
        </Card>
      ) : (
        <Card title="Status">
          <p className="text-sm text-slate-600">
            Tagihan ini sudah <b>{tw.status.replace(/_/g, " ").toLowerCase()}</b> dan tidak bisa dibayar ulang.
          </p>
        </Card>
      )}
    </div>
  );
}
