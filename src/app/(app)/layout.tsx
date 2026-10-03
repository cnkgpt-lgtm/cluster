import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Bell from "@/components/Bell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as { name: string; email: string; role: string };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar user={user} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 hidden items-center justify-end border-b border-slate-200 bg-white/85 px-6 py-3 backdrop-blur lg:flex">
          <Bell />
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
