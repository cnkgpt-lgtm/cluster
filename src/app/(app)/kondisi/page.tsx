"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Ikon from "@/components/Ikon";
import { useEscape } from "@/components/useEscape";
import { Card, Empty, Badge } from "@/components/ui";
import { formatTanggalWita, formatTanggalWaktuWita } from "@/lib/format";
import { dalamRadius } from "@/lib/absensi";

interface Lokasi { nama: string; kelurahan: string | null; kecamatan: string | null; latitude: number; longitude: number; radiusMeter: number }
interface Item { id: string; keterangan: string | null; createdAt: string }

function formatStampel(d: Date): string {
  const tgl = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Makassar", weekday: "long", day: "numeric", month: "short", year: "numeric",
  }).format(d);
  const jam = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Makassar", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).format(d);
  return `${tgl} · ${jam} WITA`;
}

// Gambar foto + stempel tanggal/jam/lokasi di bagian bawah gambar.
function buatFotoStempel(
  video: HTMLVideoElement,
  lat: number, lng: number, akurasi: number, lokasi: Lokasi,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const skala = Math.min(1, 1280 / w);
    const W = Math.round(w * skala);
    const H = Math.round(h * skala);
    const bar = Math.round(H * 0.2);
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) { reject(new Error("canvas")); return; }
    ctx.drawImage(video, 0, 0, W, H);
    // Bar stempel
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, H - bar, W, bar);
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    const pad = Math.round(W * 0.04);
    const fs1 = Math.max(20, Math.round(W * 0.036));
    const fs2 = Math.max(16, Math.round(W * 0.03));
    const wilayah = [
      lokasi.nama,
      lokasi.kelurahan ? `Kel. ${lokasi.kelurahan.replace(/^Kel\.\s*/i, "")}` : null,
      lokasi.kecamatan ? `Kec. ${lokasi.kecamatan.replace(/^Kec\.\s*/i, "")}` : null,
    ].filter(Boolean).join(" · ");
    ctx.font = `700 ${fs1}px system-ui, sans-serif`;
    ctx.fillText(formatStampel(new Date()), pad, H - bar + bar * 0.22);
    ctx.font = `600 ${fs2}px system-ui, sans-serif`;
    ctx.fillStyle = "#d7f5e3";
    ctx.fillText(wilayah, pad, H - bar + bar * 0.55);
    ctx.font = `500 ${fs2}px system-ui, sans-serif`;
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(
      `${lat.toFixed(5)}, ${lng.toFixed(5)} (±${Math.round(akurasi)} m)`,
      pad, H - bar + bar * 0.84,
    );
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.85);
  });
}

export default function KondisiPage() {
  const [lokasi, setLokasi] = useState<Lokasi | null>(null);
  const [lokasiDiatur, setLokasiDiatur] = useState(true);
  const [pos, setPos] = useState<{ lat: number; lng: number; akurasi: number } | null>(null);
  const [waktuGps, setWaktuGps] = useState(0);
  const [gpsError, setGpsError] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [ditolak, setDitolak] = useState(false);

  const [kameraBuka, setKameraBuka] = useState(false);
  const [kameraError, setKameraError] = useState("");
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [blobFoto, setBlobFoto] = useState<Blob | null>(null);
  const [keterangan, setKeterangan] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const muat = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/lokasi-absensi").then((r) => r.json()).catch(() => null),
      fetch("/api/kondisi").then((r) => {
        if (r.status === 403) setDitolak(true);
        return r.ok ? r.json() : null;
      }).catch(() => null),
    ]).then(([lok, d]) => {
      if (lok) { setLokasiDiatur(lok.diatur); setLokasi(lok.lokasi); }
      if (d) setItems(d.items ?? []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { muat(); }, [muat]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsError("Perangkat tidak mendukung GPS.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPos({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          akurasi: Math.round(p.coords.accuracy ?? 0),
        });
        setWaktuGps(p.timestamp);
        setGpsError("");
      },
      () => setGpsError("Izin lokasi ditolak. Aktifkan GPS dan izinkan akses lokasi."),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const cek = lokasi && pos ? dalamRadius(pos.lat, pos.lng, lokasi.latitude, lokasi.longitude, lokasi.radiusMeter) : null;
  const diDalam = cek?.diDalam ?? false;

  const bukaKamera = async () => {
    setPesan(null);
    setKameraError("");
    setPratinjau(null);
    setBlobFoto(null);
    if (!pos) { setPesan({ ok: false, teks: "Tunggu lokasi GPS terkunci dulu." }); return; }
    if (!diDalam) { setPesan({ ok: false, teks: `Anda di luar area (${cek?.jarak} m dari titik, maks ${lokasi?.radiusMeter} m). Foto kondisi harus diambil di dalam cluster.` }); return; }
    setKameraBuka(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setKameraError("Kamera tidak bisa dibuka. Periksa izin kamera perangkat.");
    }
  };

  const tutupKamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setKameraBuka(false);
    setKameraError("");
    setPratinjau((u) => { if (u) URL.revokeObjectURL(u); return null; });
    setBlobFoto(null);
    setKeterangan("");
  };
  useEscape(kameraBuka, tutupKamera);

  const jepret = async () => {
    const video = videoRef.current;
    if (!video || !pos || !lokasi) return;
    try {
      const blob = await buatFotoStempel(video, pos.lat, pos.lng, pos.akurasi, lokasi);
      setBlobFoto(blob);
      setPratinjau(URL.createObjectURL(blob));
      // Hentikan stream agar hemat baterai saat pratinjau
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    } catch {
      setPesan({ ok: false, teks: "Gagal mengambil foto." });
    }
  };

  const kirim = async () => {
    if (!blobFoto || !pos) return;
    setMengirim(true);
    setPesan(null);
    try {
      const fd = new FormData();
      fd.append("foto", new File([blobFoto], "kondisi.jpg", { type: "image/jpeg" }));
      fd.append("lat", String(pos.lat));
      fd.append("lng", String(pos.lng));
      fd.append("akurasi", String(pos.akurasi));
      fd.append("waktuGps", new Date(waktuGps).toISOString());
      fd.append("keterangan", keterangan);
      const r = await fetch("/api/kondisi", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const peta: Record<string, string> = {
          FOTO_WAJIB: "Foto wajib diambil.",
          DI_LUAR_AREA: `Ditolak: Anda ${d.jarak ?? "?"} m dari titik (maks ${d.radiusMeter ?? "?"} m).`,
          LOKASI_BELUM_DIATUR: "Titik lokasi belum diatur pengurus.",
          GPS_KADALUARSA: "Data lokasi kedaluwarsa. Coba lagi.",
          UPLOAD_GAGAL: "Upload foto gagal, coba lagi.",
        };
        setPesan({ ok: false, teks: peta[d.error as string] ?? "Gagal mengirim foto." });
      } else {
        setPesan({ ok: true, teks: `Foto kondisi terkirim ${formatTanggalWaktuWita(d.createdAt)}.` });
        tutupKamera();
        muat();
      }
    } catch {
      setPesan({ ok: false, teks: "Jaringan bermasalah, coba lagi." });
    } finally {
      setMengirim(false);
    }
  };

  if (ditolak) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card title="Foto Kondisi"><p className="text-sm text-slate-600">Halaman ini hanya untuk Security.</p></Card>
      </div>
    );
  }

  return (
    <div className="anim-fade-up mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold text-slate-800">
          <Ikon nama="kamera" className="h-6 w-6" /> Foto Kondisi Cluster
        </h1>
        <p className="text-sm text-slate-500">Foto suasana terkini — tanggal, jam, kelurahan/kecamatan & lokasi otomatis tercetak di foto.</p>
      </div>

      {pesan && (
        <div className={`rounded-2xl border p-3 text-sm font-semibold ${pesan.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {pesan.teks}
        </div>
      )}

      {!lokasiDiatur && (
        <Card title={<span className="inline-flex items-center gap-2"><Ikon nama="peringatan" className="h-5 w-5" /> Lokasi Belum Diatur</span>}>
          <p className="text-sm text-slate-600">Titik lokasi perumahan belum diatur oleh pengurus. Foto kondisi belum bisa digunakan.</p>
        </Card>
      )}

      <Card title={<span className="inline-flex items-center gap-2"><Ikon nama="lokasi" className="h-5 w-5" /> Posisi Saya</span>}>
        {gpsError ? (
          <p className="text-sm font-semibold text-red-600">{gpsError}</p>
        ) : !pos ? (
          <p className="text-sm text-slate-500">Mengunci sinyal GPS…</p>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`text-sm font-bold ${diDalam ? "text-emerald-700" : "text-red-600"}`}>
                {diDalam ? "Dalam area perumahan" : "Di luar area perumahan"}
              </p>
              <p className="text-xs text-slate-500">
                Jarak {cek?.jarak} m dari titik (maks {lokasi?.radiusMeter} m) · akurasi ±{pos.akurasi} m
              </p>
            </div>
            <Badge tone={diDalam ? "green" : "red"}>{cek?.jarak} m</Badge>
          </div>
        )}
      </Card>

      <button
        onClick={bukaKamera}
        disabled={!diDalam}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-4 text-sm font-extrabold text-white shadow-md shadow-emerald-700/25 transition hover:bg-emerald-800 active:scale-95 disabled:opacity-40"
      >
        <Ikon nama="kamera" className="h-5 w-5" /> Ambil Foto Kondisi
      </button>

      <Card title={<span className="inline-flex items-center gap-2"><Ikon nama="kalender" className="h-5 w-5" /> Foto Terkirim</span>}>
        {loading ? (
          <p className="text-sm text-slate-500">Memuat…</p>
        ) : items.length === 0 ? (
          <Empty icon="kamera" title="Belum ada foto" sub="Foto kondisi yang Anda kirim akan tampil di sini." />
        ) : (
          <ul className="grid grid-cols-3 gap-2">
            {items.map((it) => (
              <li key={it.id}>
                <a href={`/api/kondisi/foto?id=${it.id}`} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200">
                  <img
                    src={`/api/kondisi/foto?id=${it.id}`}
                    alt={it.keterangan ?? "Foto kondisi"}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                </a>
                <p className="mt-1 truncate text-[11px] text-slate-500">
                  {formatTanggalWaktuWita(it.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Modal kamera */}
      {kameraBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={tutupKamera}>
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <p className="font-extrabold text-slate-800">Foto Kondisi Cluster</p>
              <button onClick={tutupKamera} className="rounded-full bg-slate-100 p-2" aria-label="Tutup kamera">
                <Ikon nama="silang" className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              {kameraError ? (
                <p className="text-center text-sm text-red-600">{kameraError}</p>
              ) : pratinjau ? (
                <>
                  <img src={pratinjau} alt="Pratinjau foto kondisi" className="w-full rounded-2xl" />
                  <p className="mt-2 text-xs text-slate-500">Tanggal, jam, dan lokasi sudah tercetak di bagian bawah foto.</p>
                  <input
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    maxLength={140}
                    placeholder="Keterangan singkat (opsional), mis. Gerbang utama aman"
                    className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setPratinjau(null); setBlobFoto(null); bukaKamera(); }}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600"
                    >
                      Ulangi
                    </button>
                    <button
                      onClick={kirim}
                      disabled={mengirim}
                      className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50"
                    >
                      {mengirim ? "Mengirim…" : "Kirim Foto"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full rounded-2xl bg-black object-cover" />
                  <button
                    onClick={jepret}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-md transition active:scale-95"
                  >
                    <Ikon nama="kamera" className="h-5 w-5" /> Jepret
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
