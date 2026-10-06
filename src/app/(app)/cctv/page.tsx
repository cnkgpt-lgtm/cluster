import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, Empty } from "@/components/ui";
import CctvPlayer from "@/components/CctvPlayer";
import KelolaCctv from "@/components/KelolaCctv";

export const dynamic = "force-dynamic";

export default async function CctvPage() {
  const session = await auth();
  const role = (session!.user as { role: string }).role;
  const bisaKelola = role === "PENGURUS";

  const kamera = await prisma.kameraCctv.findMany({
    where: bisaKelola ? {} : { status: "AKTIF" },
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
  });

  return (
    <div className="anim-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">CCTV Lingkungan</h1>
        <p className="text-sm text-slate-500">Pantau kamera keamanan perumahan secara langsung. Bisa dilihat semua warga.</p>
      </div>

      {kamera.length === 0 ? (
        <Card title="Kamera">
          <Empty icon="📹" title="Belum ada kamera aktif" sub="Pengurus dapat menambahkan kamera di bawah." />
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {kamera.map((k) => (
            <div key={k.id}>
              <CctvPlayer src={k.streamUrl} nama={k.nama} />
              {k.lokasi && <p className="mt-1.5 text-xs text-slate-500">📍 {k.lokasi}</p>}
            </div>
          ))}
        </div>
      )}

      {bisaKelola && <KelolaCctv awal={kamera} />}
    </div>
  );
}
