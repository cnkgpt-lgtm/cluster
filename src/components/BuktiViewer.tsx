"use client";

import { useState } from "react";
import { isDriveLink, driveThumbnailUrl } from "@/lib/gdrive-link";

// Penampil bukti bayar bersama: dipakai di Validasi & Kartu Kontrol.
// - Telegram (tg:): thumbnail + 2 opsi lihat tanpa download (modal di sini / tab baru)
// - Google Drive: thumbnail + link drive
// - URL langsung: thumbnail / tautan PDF
export default function BuktiViewer({
  url,
  pembayaranId,
  ringkas = false,
}: {
  url: string;
  pembayaranId: string;
  ringkas?: boolean;
}) {
  const [lihat, setLihat] = useState(false);
  const [pdfMode, setPdfMode] = useState(false);
  const bukaModal = () => {
    setPdfMode(false);
    setLihat(true);
  };

  if (url.startsWith("tg:")) {
    const proxy = `/api/pembayaran/${pembayaranId}/bukti`;
    return (
      <div className={ringkas ? "" : "mt-3"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={proxy}
          alt="Bukti bayar"
          onClick={bukaModal}
          className={`${ringkas ? "max-h-24" : "max-h-64"} cursor-zoom-in rounded-xl border border-slate-200`}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={bukaModal}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-700"
          >
            👁️ Lihat di Sini
          </button>
          <a
            href={proxy}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-200"
          >
            ↗ Tab Baru
          </a>
        </div>
        {!ringkas && (
          <p className="mt-1 text-xs text-slate-400">Tersimpan di Telegram — tampil tanpa mengunduh.</p>
        )}

        {lihat && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4" onClick={() => setLihat(false)}>
            <button
              onClick={() => setLihat(false)}
              className="self-end rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
            >
              ✕ Tutup
            </button>
            <div
              className="flex min-h-0 flex-1 items-center justify-center py-2"
              onClick={(e) => e.stopPropagation()}
            >
              {pdfMode ? (
                <iframe src={proxy} title="Bukti bayar" className="h-full w-full max-w-4xl rounded-xl bg-white" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proxy}
                  alt="Bukti bayar"
                  onError={() => setPdfMode(true)}
                  className="max-h-full max-w-full rounded-xl object-contain"
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isDriveLink(url)) {
    const thumb = driveThumbnailUrl(url);
    return (
      <div className={ringkas ? "" : "mt-3"}>
        <a href={url} target="_blank" rel="noreferrer" className="block">
          {thumb && !url.includes(".pdf") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt="Bukti bayar"
              className={`${ringkas ? "max-h-24" : "max-h-64"} rounded-xl border border-slate-200`}
            />
          ) : null}
          <span className="mt-2 inline-block rounded-xl bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-200">
            📁 Lihat Bukti di Google Drive ↗
          </span>
        </a>
      </div>
    );
  }

  return (
    <div className={ringkas ? "" : "mt-3"}>
      <a href={url} target="_blank" rel="noreferrer" className="block">
        {url.endsWith(".pdf") ? (
          <span className="inline-block rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            📄 Lihat Bukti (PDF) ↗
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Bukti bayar"
            className={`${ringkas ? "max-h-24" : "max-h-64"} rounded-xl border border-slate-200`}
          />
        )}
      </a>
    </div>
  );
}
