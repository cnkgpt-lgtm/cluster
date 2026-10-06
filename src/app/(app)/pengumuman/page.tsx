import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatTanggalWita } from "@/lib/format";
import { Card, Badge, Empty } from "@/components/ui";
import PengumumanForm from "@/components/PengumumanForm";

export const dynamic = "force-dynamic";

const KATEGORI_TONE: Record<string, "green" | "amber" | "red" | "sky" | "slate"> = {
  UMUM: "slate",
  KEAMANAN: "sky",
  KEBERSIHAN: "green",
  KEGIATAN: "amber",
  DARURAT: "red",
};

export default async function PengumumanPage() {
  const session = await auth();
  const role = (session!.user as { role: string }).role;
  const bisaTulis = role === "PENGURUS" || role === "SEKRETARIS";

  const items = await prisma.pengumuman.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { dibuatOleh: { select: { name: true, role: true } } },
  });

  return (
    <div className="anim-fade-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Pengumuman</h1>
          <p className="text-sm text-slate-500">Informasi resmi dari pengurus RT/R.</p>
        </div>
        {bisaTulis && <PengumumanForm />}
      </div>

      {items.length === 0 ? (
        <Card title="Daftar Pengumuman">
          <Empty icon="📭" title="Belum ada pengumuman" />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/pengumuman/${p.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={KATEGORI_TONE[p.kategori] ?? "slate"}>{p.kategori}</Badge>
                <span className="text-xs text-slate-400">{formatTanggalWita(p.createdAt)}</span>
              </div>
              <h2 className="font-bold text-slate-900">{p.judul}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.isi}</p>
              <p className="mt-3 text-xs text-slate-400">oleh {p.dibuatOleh.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
