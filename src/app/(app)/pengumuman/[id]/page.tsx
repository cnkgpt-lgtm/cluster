import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatTanggalWita } from "@/lib/format";
import { Card, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DetailPengumumanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.pengumuman.findUnique({
    where: { id },
    include: { dibuatOleh: { select: { name: true, role: true } } },
  });
  if (!p || !p.isPublished) notFound();

  return (
    <div className="anim-fade-up mx-auto max-w-2xl space-y-6">
      <Link href="/pengumuman" className="text-sm font-semibold text-emerald-700 hover:underline">
        ← Semua Pengumuman
      </Link>
      <Card title={p.judul}>
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <Badge tone="slate">{p.kategori}</Badge>
          <span>{formatTanggalWita(p.createdAt)}</span>
          <span>· oleh {p.dibuatOleh.name}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{p.isi}</p>
      </Card>
    </div>
  );
}
