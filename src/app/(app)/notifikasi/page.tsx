"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Badge, Empty } from "@/components/ui";

interface Notif {
  id: string;
  judul: string;
  pesan: string;
  tipe: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

const TIPE_ICON: Record<string, string> = {
  PEMBAYARAN: "💳",
  VALIDASI: "✅",
  PENGUMUMAN: "📢",
  TAGIHAN: "🧾",
  INFO: "ℹ️",
};

export default function NotifikasiPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/notifikasi");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function tandaiSemua() {
    await fetch("/api/notifikasi", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
  }

  return (
    <div className="anim-stagger mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Notifikasi</h1>
          <p className="text-sm text-slate-500">Info pembayaran lunas, hasil validasi, tagihan, dan pengumuman.</p>
        </div>
        <button onClick={tandaiSemua} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
          Tandai semua dibaca
        </button>
      </div>

      <Card title="Semua Notifikasi">
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <Empty icon="🔔" title="Belum ada notifikasi" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((n) => {
              const body = (
                <div className={`flex gap-3 py-3.5 ${n.isRead ? "opacity-70" : ""}`}>
                  <span className="text-2xl">{TIPE_ICON[n.tipe] ?? "ℹ️"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold text-slate-800">
                      {n.judul}
                      {!n.isRead && <Badge tone="sky">baru</Badge>}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">{n.pesan}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString("id-ID")}</p>
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.linkUrl ? (
                    <Link href={n.linkUrl} className="block rounded-xl transition hover:bg-slate-50">{body}</Link>
                  ) : body}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
