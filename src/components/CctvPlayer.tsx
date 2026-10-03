"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export default function CctvPlayer({ src, nama }: { src: string; nama: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError("");
    let hls: Hls | null = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari: HLS native
      video.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 30 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setError("Stream tidak dapat dimuat. Periksa URL / koneksi kamera.");
      });
    } else {
      setError("Browser tidak mendukung pemutaran HLS.");
    }

    return () => {
      hls?.destroy();
    };
  }, [src]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-md">
      <div className="flex items-center justify-between px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm font-bold text-white">
          <span className="live-dot inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          {nama}
        </p>
        <span className="rounded bg-red-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Live
        </span>
      </div>
      {error ? (
        <div className="flex aspect-video flex-col items-center justify-center gap-2 p-6 text-center">
          <span className="text-3xl">📡</span>
          <p className="text-sm text-slate-300">{error}</p>
        </div>
      ) : (
        <video ref={videoRef} controls muted playsInline className="cctv-video aspect-video w-full" />
      )}
    </div>
  );
}
