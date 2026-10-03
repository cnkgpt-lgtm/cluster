"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Bell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const res = await fetch("/api/notifikasi?unread=1", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!stop) setCount(data.unread ?? 0);
      } catch {
        /* abaikan */
      }
    }
    load();
    const t = setInterval(load, 30000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  return (
    <Link
      href="/notifikasi"
      className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
      aria-label="Notifikasi"
    >
      <span className="text-lg leading-none">🔔</span>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
