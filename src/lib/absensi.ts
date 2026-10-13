// Helper absensi: tanggal WITA & geofence Haversine.

const WITA_OFFSET_JAM = 8;

/** Awal hari ini dalam zona WITA, sebagai Date UTC (00:00 WITA). */
export function awalHariWita(ref: Date = new Date()): Date {
  const wita = new Date(ref.getTime() + WITA_OFFSET_JAM * 3_600_000);
  const y = wita.getUTCFullYear();
  const m = wita.getUTCMonth();
  const d = wita.getUTCDate();
  return new Date(Date.UTC(y, m, d, -WITA_OFFSET_JAM, 0, 0, 0));
}

/** Tanggal hari ini (WITA) sebagai string YYYY-MM-DD. */
export function tanggalWitaISO(ref: Date = new Date()): string {
  return awalHariWita(ref).toISOString().slice(0, 10);
}

/** Jarak dua titik koordinat dalam meter (Haversine). */
export function jarakMeter(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Cek apakah titik berada dalam radius (meter) dari pusat. */
export function dalamRadius(
  lat: number,
  lng: number,
  pusatLat: number,
  pusatLng: number,
  radiusMeter: number,
): { diDalam: boolean; jarak: number } {
  const jarak = jarakMeter(lat, lng, pusatLat, pusatLng);
  return { diDalam: jarak <= radiusMeter, jarak: Math.round(jarak) };
}

export interface SampelGps {
  lat: number;
  lng: number;
  akurasi: number; // meter
  waktu: number; // epoch ms
}

const SAMPEL_MINIMAL = 4;

/**
 * Analisis anti fake GPS dari beberapa sampel.
 * GPS asli selalu bergoyang (jitter) walau perangkat diam; aplikasi fake GPS
 * umumnya mengembalikan koordinat yang PERSIS sama setiap saat.
 * Mengembalikan { varianNol } — true bila semua sampel identik total.
 */
export function analisisSampelGps(sampel: SampelGps[]): {
  cukup: boolean;
  varianNol: boolean;
  akurasiRata: number | null;
  jumlah: number;
} {
  const jumlah = sampel.length;
  if (jumlah < SAMPEL_MINIMAL) {
    return { cukup: false, varianNol: false, akurasiRata: null, jumlah };
  }
  const latUnik = new Set(sampel.map((s) => s.lat.toFixed(7))).size;
  const lngUnik = new Set(sampel.map((s) => s.lng.toFixed(7))).size;
  const akurasiRata = Math.round(
    sampel.reduce((a, s) => a + (Number.isFinite(s.akurasi) ? s.akurasi : 9999), 0) / jumlah,
  );
  return {
    cukup: true,
    varianNol: latUnik === 1 && lngUnik === 1,
    akurasiRata,
    jumlah,
  };
}

/** Kecepatan (km/jam) antara dua titik berwaktu; null bila tak bisa dihitung. */
export function kecepatanKmh(
  lat1: number, lng1: number, t1: Date,
  lat2: number, lng2: number, t2: Date,
): number | null {
  const dtJam = Math.abs(t2.getTime() - t1.getTime()) / 3_600_000;
  if (dtJam <= 0) return null;
  return jarakMeter(lat1, lng1, lat2, lng2) / 1000 / dtJam;
}
