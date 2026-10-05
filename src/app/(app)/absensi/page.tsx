"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, Empty, Badge, StatCard } from "@/components/ui";
import { formatTanggalWita, formatTanggalWaktuWita } from "@/lib/format";

interface Lokasi { nama: string; latitude: number; longitude: number; radiusMeter: number }
interface HariIni { jamMasuk: string | null; jamPulang: string | null }
interface Riwayat { tanggal: string; jamMasuk: string | null; jamPulang: string | null }

function jarakMeter(a: number, b: number, c: number, d: number): number {
  const R = 6_371_000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(rad(c - a) / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(d - b) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function AbsensiPage() {
  const [lokasi, setLokasi] = useState<Lokasi | null>(null);
  const [lokasiDiatur, setLokasiDiatur] = useState(true);
  const [pos, setPos] = useState<{ lat: number; lng: number; akurasi: number } | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [hariIni, setHariIni] = useState<HariIni | null>(null);
  const [riwayat, setRiwayat] = useState<Riwayat[]>([]);
  const [loading, setLoading] = useState(true);
  const [ditolak, setDitolak] = useState(false);

  // Kamera
  const [kameraBuka, setKameraBuka] = useState<"masuk" | "pulang" | null>(null);
  const [kameraError, setKameraError] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const muat = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/lokasi-absensi").then((r) => r.json()).catch(() => null),
      fetch("/api/absensi").then((r) => {
        if (r.status === 403) setDitolak(true);
        return r.ok ? r.json() : null;
      }).catch(() => null),
    ]).then(([lok, abs]) => {
      if (lok) { setLokasiDiatur(lok.diatur); setLokasi(lok.lokasi); }
      if (abs) { setHariIni(abs.hariIni); setRiwayat(abs.riwayat ?? []); }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { muat(); }, [muat]);

  // GPS — pantau posisi
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsError("Perangkat tidak mendukung GPS.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude, akurasi: Math.round(p.coords.accuracy ?? 0) });
        setGpsError("");
      },
      () => setGpsError("Izin lokasi ditolak — aktifkan GPS & izinkan akses lokasi."),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const jarak = lokasi && pos ? Math.round(jarakMeter(pos.lat, pos.lng, lokasi.latitude, lokasi.longitude)) : null;
  const diDalam = jarak !== null && lokasi ? jarak <= lokasi.radiusMeter : false;

  // Kamera
  const bukaKamera = async (tipe: "masuk" | "pulang") => {
    setPesan(null);
    setKameraError("");
    if (!pos) { setPesan({ ok: false, teks: "Tunggu lokasi GPS terkunci dulu." }); return; }
    if (!diDalam) { setPesan({ ok: false, teks: `Anda di luar area (${jarak} m dari titik, maks ${lokasi?.radiusMeter} m).` }); return; }
    setKameraBuka(tipe);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setKameraError("Kamera tidak bisa dibuka. Gunakan tombol upload foto di bawah.");
    }
  };

  const tutupKamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setKameraBuka(null);
    setKameraError("");
  };

  const kirimAbsen = async (file: File, tipe: "masuk" | "pulang") => {
    if (!pos) return;
    setMengirim(true);
    setPesan(null);
    try {
      const fd = new FormData();
      fd.append("tipe", tipe);
      fd.append("foto", file, "selfie.jpg");
      fd.append("lat", String(pos.lat));
      fd.append("lng", String(pos.lng));
      const r = await fetch("/api/absensi", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const petaPesan: Record<string, string> = {
          SELFIE_WAJIB: "Selfie wajah wajib diambil.",
          DI_LUAR_AREA: `Ditolak: Anda ${d.jarak ?? "?"} m dari titik (maks ${d.radiusMeter ?? "?"} m).`,
          SUDAH_ABSEN_MASUK: `Sudah absen masuk (${d.jamMasuk ?? ""}).`,
          SUDAH_ABSEN_PULANG: `Sudah absen pulang (${d.jamPulang ?? ""}).`,
          BELUM_ABSEN_MASUK: "Absen masuk dulu sebelum absen pulang.",
          LOKASI_BELUM_DIATUR: "Titik lokasi belum diatur pengurus.",
          UPLOAD_GAGAL: "Upload selfie gagal, coba lagi.",
        };
        setPesan({ ok: false, teks: petaPesan[d.error as string] ?? "Gagal menyimpan absensi." });
      } else {
        setPesan({
          ok: true,
          teks: tipe === "masuk"
            ? `✅ Absen masuk tercatat ${formatTanggalWaktuWita(d.jamMasuk)}. Selamat bertugas!`
            : `✅ Absen pulang tercatat ${formatTanggalWaktuWita(d.jamPulang)}. Terima kasih!`,
        });
        tutupKamera();
        muat();
      }
    } catch {
      setPesan({ ok: false, teks: "Jaringan bermasalah, coba lagi." });
    } finally {
      setMengirim(false);
    }
  };

  const ambilFoto = () => {
    const video = videoRef.current;
    if (!video || !kameraBuka) return;
    const canvas = document.createElement("canvas");
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    const sisi = Math.min(w, h, 720);
    canvas.width = sisi; canvas.height = sisi;
    const ctx = canvas.getContext("2d")!;
    // cermin agar seperti selfie, lalu crop persegi tengah
    ctx.translate(sisi, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, (w - sisi) / 2, (h - sisi) / 2, sisi, sisi, 0, 0, sisi, sisi);
    canvas.toBlob((blob) => {
      if (blob) kirimAbsen(new File([blob], "selfie.jpg", { type: "image/jpeg" }), kameraBuka);
      else setPesan({ ok: false, teks: "Gagal mengambil foto." });
    }, "image/jpeg", 0.85);
  };

  if (ditolak) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card title="Absensi"><p className="text-sm text-slate-600">Halaman ini hanya untuk Security.</p></Card>
      </div>
    );
  }

  const sudahMasuk = !!hariIni?.jamMasuk;
  const sudahPulang = !!hariIni?.jamPulang;

  return (
    <div className="anim-fade-up mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">🛡️ Absensi Security</h1>
        <p className="text-sm text-slate-500">Selfie wajah + GPS area perumahan.</p>
      </div>

      {pesan && (
        <div className={`rounded-2xl border p-3 text-sm font-semibold ${pesan.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {pesan.teks}
        </div>
      )}

      {!lokasiDiatur && (
        <Card title="⚠️ Lokasi Belum Diatur">
          <p className="text-sm text-slate-600">Titik lokasi perumahan belum diatur oleh pengurus. Absensi belum bisa digunakan.</p>
        </Card>
      )}

      {/* Status GPS */}
      <Card title="📍 Posisi Saya">
        {gpsError ? (
          <p className="text-sm font-semibold text-red-600">{gpsError}</p>
        ) : !pos ? (
          <p className="text-sm text-slate-500">Mengunci sinyal GPS…</p>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`text-sm font-bold ${diDalam ? "text-emerald-700" : "text-red-600"}`}>
                {diDalam ? "✅ Dalam area perumahan" : "⚠️ Di luar area perumahan"}
              </p>
              <p className="text-xs text-slate-500">
                Jarak {jarak} m dari titik (maks {lokasi?.radiusMeter} m) · akurasi ±{pos.akurasi} m
              </p>
            </div>
            <Badge tone={diDalam ? "green" : "red"}>{jarak} m</Badge>
          </div>
        )}
      </Card>

      {/* Status hari ini */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Jam Masuk" value={hariIni?.jamMasuk ? formatTanggalWaktuWita(hariIni.jamMasuk).split(", ")[1] ?? "—" : "—"} sub="hari ini" icon="🟢" tone="emerald" />
        <StatCard label="Jam Pulang" value={hariIni?.jamPulang ? formatTanggalWaktuWita(hariIni.jamPulang).split(", ")[1] ?? "—" : "—"} sub="hari ini" icon="🔴" tone="sky" />
      </div>

      {/* Tombol absen */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => bukaKamera("masuk")}
          disabled={!sudahMasuk ? false : true}
          className={`rounded-2xl px-4 py-4 text-sm font-extrabold shadow-md transition active:scale-95 disabled:opacity-40 ${
            sudahMasuk ? "bg-slate-200 text-slate-500" : "bg-emerald-600 text-white shadow-emerald-600/25 hover:bg-emerald-700"
          }`}
        >
          📸 Absen Masuk
        </button>
        <button
          onClick={() => bukaKamera("pulang")}
          disabled={!sudahMasuk || sudahPulang}
          className={`rounded-2xl px-4 py-4 text-sm font-extrabold shadow-md transition active:scale-95 disabled:opacity-40 ${
            sudahMasuk && !sudahPulang ? "bg-sky-600 text-white shadow-sky-600/25 hover:bg-sky-700" : "bg-slate-200 text-slate-500"
          }`}
        >
          📸 Absen Pulang
        </button>
      </div>
      {sudahPulang && (
        <p className="text-center text-sm font-semibold text-emerald-700">Shift hari ini selesai. Terima kasih! 🙏</p>
      )}

      {/* Riwayat */}
      <Card title="🗓️ Riwayat Absensi">
        {loading ? (
          <p className="text-sm text-slate-400">Memuat…</p>
        ) : riwayat.length === 0 ? (
          <Empty icon="🛡️" title="Belum ada riwayat" sub="Absensi Anda akan tercatat di sini." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {riwayat.map((r) => (
              <li key={r.tanggal} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="font-semibold text-slate-800">{formatTanggalWita(r.tanggal)}</p>
                  <p className="text-xs text-slate-500">
                    Masuk: {r.jamMasuk ? formatTanggalWaktuWita(r.jamMasuk).split(", ")[1] : "—"}
                    {" · "}Pulang: {r.jamPulang ? formatTanggalWaktuWita(r.jamPulang).split(", ")[1] : "—"}
                  </p>
                </div>
                <Badge tone={r.jamPulang ? "green" : r.jamMasuk ? "amber" : "slate"}>
                  {r.jamPulang ? "Selesai" : r.jamMasuk ? "Bertugas" : "—"}
                </Badge>
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
              <p className="font-extrabold text-slate-800">
                {kameraBuka === "masuk" ? "📸 Selfie Absen Masuk" : "📸 Selfie Absen Pulang"}
              </p>
              <button onClick={tutupKamera} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">✕</button>
            </div>
            <div className="p-4">
              {kameraError ? (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-red-600">{kameraError}</p>
                  <label className="block cursor-pointer rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">
                    📤 Upload Foto Selfie
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f && kameraBuka) kirimAbsen(f, kameraBuka);
                      }}
                    />
                  </label>
                </div>
              ) : (
                <>
                  <video ref={videoRef} playsInline muted className="aspect-square w-full -scale-x-100 rounded-2xl bg-black object-cover" />
                  <button
                    onClick={ambilFoto}
                    disabled={mengirim}
                    className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-md transition active:scale-95 disabled:opacity-50"
                  >
                    {mengirim ? "⏳ Mengirim…" : "📸 Ambil & Kirim"}
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
