import { prisma } from "@/lib/db";
import { Card, Badge, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";

const ROLE_TONE: Record<string, "green" | "amber" | "red" | "sky" | "slate"> = {
  PENGURUS: "amber",
  BENDAHARA: "green",
  SEKRETARIS: "sky",
  WARGA: "slate",
};

const ROLE_LABEL: Record<string, string> = {
  PENGURUS: "Pengurus",
  BENDAHARA: "Bendahara",
  SEKRETARIS: "Sekretaris",
  WARGA: "Warga",
};

export default async function WargaPage() {
  const items = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: [{ role: "asc" }, { blok: "asc" }, { nomorRumah: "asc" }, { name: "asc" }],
    select: { id: true, name: true, role: true, blok: true, nomorRumah: true, phone: true, alamat: true },
  });

  const pengurus = items.filter((u) => u.role !== "WARGA");
  const warga = items.filter((u) => u.role === "WARGA");

  return (
    <div className="anim-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Info Warga</h1>
        <p className="text-sm text-slate-500">Direktori pengurus dan warga perumahan.</p>
      </div>

      <Card title={`Pengurus RT (${pengurus.length})`}>
        {pengurus.length === 0 ? (
          <Empty icon="👥" title="Belum ada data" />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {pengurus.map((u) => (
              <li key={u.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-lg">🧑‍💼</span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-500">
                    <Badge tone={ROLE_TONE[u.role] ?? "slate"}>{ROLE_LABEL[u.role] ?? u.role}</Badge>
                    {u.phone && <span className="ml-2">{u.phone}</span>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Warga (${warga.length})`}>
        {warga.length === 0 ? (
          <Empty icon="🏘️" title="Belum ada data warga" />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {warga.map((u) => (
              <li key={u.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-lg">🏠</span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-500">
                    {u.blok ? `Blok ${u.blok}` : ""}{u.nomorRumah ? ` No. ${u.nomorRumah}` : ""}
                    {u.phone ? ` · 📱 ${u.phone}` : ""}
                  </p>
                  {u.alamat && <p className="mt-0.5 truncate text-xs text-slate-400">📍 {u.alamat}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
