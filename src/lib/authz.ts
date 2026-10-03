import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

export async function sesiWajib() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function wajibRole(...roles: Role[]) {
  const session = await sesiWajib();
  const role = (session.user as { role?: Role }).role;
  if (!role || !roles.includes(role)) redirect("/dashboard?error=forbidden");
  return session;
}

export function bisaKelolaKeuangan(role?: Role): boolean {
  return role === "PENGURUS" || role === "BENDAHARA";
}

export function bisaKelolaPengumuman(role?: Role): boolean {
  return role === "PENGURUS" || role === "SEKRETARIS";
}

export function bisaKelolaPengguna(role?: Role): boolean {
  return role === "PENGURUS";
}

export function bisaKelolaCctv(role?: Role): boolean {
  return role === "PENGURUS";
}
