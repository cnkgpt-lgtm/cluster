"use client";
import { useEffect } from "react";

// Tutup modal/drawer dengan tombol Escape (aksesibilitas keyboard, R-26/R-32).
export function useEscape(aktif: boolean, onTutup: () => void) {
  useEffect(() => {
    if (!aktif) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutup();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [aktif, onTutup]);
}
