"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui";

const Peta = dynamic(() => import("@/components/PetaLokasi"), { ssr: false });

// Default: Makassar (WITA) bila belum ada titik tersimpan
const DEFAULT = { lat: -5.1477, lng: 119.4327 };

export default function LokasiPage() {
  const [nama, setNama] = useState("Perumahan");
  const [lat, setLat] = useState(DEFAULT.lat);
  const [lng, setLng] = useState(DEFAULT.lng);
  const [radius, setRadius] = useState(200);
  const [diatur, setDiatur] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [ditolak, setDitolak] = useState(false);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);

  const muat = useCallback(() => {
    setLoading(true);
    fetch("/api/lokasi-absensi")
      .then((r) => {
        if (r.status === 403) setDitolak(true);
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        if (d?.lokasi) {
          setNama(d.lokasi.nama);
          setLat(d.lokasi.latitude);
          setLng(d.lokasi.longitude);
          setRadius(d.lokasi.radiusMeter);
          setDiatur(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { muat(); }, [muat]);

  const gunakanLokasiSaya = () => {
    if (!("geolocation" in navigator)) {
      setPesan({ ok: false, teks: "Perangkat tidak mendukung GPS." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude);
        setLng(p.coords.longitude);
        setPesan({ ok: true, teks: "📍 Titik diambil dari posisi Anda — geser bila perlu lalu simpan." });
      },
      () => setPesan({ ok: false, teks: "Izin lokasi ditolak." }),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const simpan = async () => {
    setMenyimpan(true);
    setPesan(null);
    try {
      const r = await fetch("/api/lokasi-absensi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, latitude: lat, longitude: lng, radiusMeter: radius }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setPesan({ ok: false, teks: "Gagal menyimpan. Periksa kembali titik & radius." });
      } else {
        setDiatur(true);
        setPesan({ ok: true, teks: `✅ Lokasi "${d.lokasi.nama}" tersimpan — radius ${d.lokasi.radiusMeter} m.` });
      }
    } catch {
      setPesan({ ok: false, teks: "Jaringan bermasalah." });
    } finally {
      setMenyimpan(false);
    }
  };

  if (ditolak) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card title="Pengaturan Lokasi">
          <p className="text-sm text-slate-600">Halaman ini hanya untuk Pengurus.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="anim-fade-up mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">🗺️ Lokasi Absensi</h1>
        <p className="text-sm text-slate-500">
          Tentukan titik perumahan di peta. Security hanya bisa absen di dalam lingkaran hijau.
        </p>
      </div>

      {pesan && (
        <div className={`rounded-2xl border p-3 text-sm font-semibold ${pesan.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {pesan.teks}
        </div>
      )}

      <Card title={diatur ? "✅ Titik sudah diatur" : "⚠️ Titik belum diatur"}>
        {loading ? (
          <p className="text-sm text-slate-400">Memuat peta…</p>
        ) : (
          <div className="space-y-4">
            <Peta
              lat={lat}
              lng={lng}
              radius={radius}
              onPilih={(a, b) => { setLat(a); setLng(b); }}
            />
            <p className="text-xs text-slate-500">
              Ketuk peta atau seret pin 📍 untuk memindahkan titik. Lingkaran hijau = area absen.
            </p>

            <div>
              <label className="text-sm font-bold text-slate-700">Nama lokasi</label>
              <input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Perumahan"
                maxLength={80}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">Radius area absen</label>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-extrabold text-emerald-700">
                  {radius} m
                </span>
              </div>
              <input
                type="range"
                min={25}
                max={1000}
                step={25}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="mt-2 w-full accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>25 m</span><span>1000 m</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-400">Latitude</p>
                <p className="font-mono text-sm font-bold">{lat.toFixed(6)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-400">Longitude</p>
                <p className="font-mono text-sm font-bold">{lng.toFixed(6)}</p>
              </div>
              <button
                onClick={gunakanLokasiSaya}
                className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-700 transition hover:bg-sky-100"
              >
                📍 Lokasi saya
              </button>
            </div>

            <button
              onClick={simpan}
              disabled={menyimpan}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
            >
              {menyimpan ? "⏳ Menyimpan…" : "💾 Simpan Lokasi"}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
