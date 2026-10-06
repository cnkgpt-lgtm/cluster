import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ProfilForms } from "@/components/profil";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) redirect("/login");

  const profil = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      role: true,
      phone: true,
      alamat: true,
      blok: true,
      nomorRumah: true,
    },
  });
  if (!profil) redirect("/login");

  return (
    <div className="anim-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Profil Saya</h1>
        <p className="text-sm text-slate-500">Lengkapi identitas Anda dan kelola kata sandi akun.</p>
      </div>
      <ProfilForms awal={profil} />
    </div>
  );
}
