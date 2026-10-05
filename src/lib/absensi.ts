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
