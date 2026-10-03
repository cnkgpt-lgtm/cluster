export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "emerald",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  tone?: "emerald" | "amber" | "red" | "sky" | "violet";
}) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    sky: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`rounded-xl px-2.5 py-1.5 text-lg ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-2 break-words text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Badge({ tone, children }: { tone: "green" | "amber" | "red" | "sky" | "slate"; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    sky: "bg-sky-100 text-sky-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function badgeStatusBayar(status: string) {
  switch (status) {
    case "LUNAS":
    case "PAID":
      return <Badge tone="green">Lunas</Badge>;
    case "MENUNGGU_VALIDASI":
      return <Badge tone="amber">Sedang Diverifikasi</Badge>;
    case "KEDALUWARSA":
    case "EXPIRED":
      return <Badge tone="red">Kedaluwarsa</Badge>;
    case "DITOLAK":
    case "FAILED":
      return <Badge tone="red">Ditolak/Gagal</Badge>;
    default:
      return <Badge tone="sky">Belum Bayar</Badge>;
  }
}

export function Empty({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="mt-2 font-semibold text-slate-700">{title}</p>
      {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
    </div>
  );
}
