// Sliding-window rate limiter in-memory (per instance).
// Cukup untuk menahan brute-force/credential-stuffing kasar di /api/auth.
// Untuk proteksi lintas-instance, lengkapi dengan rate limiting di lapisan
// Vercel Firewall / WAF.
const buckets = new Map<string, number[]>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const prev = buckets.get(key);
  const fresh = prev ? prev.filter((t) => now - t < windowMs) : [];
  if (fresh.length >= limit) {
    buckets.set(key, fresh);
    return false;
  }
  fresh.push(now);
  buckets.set(key, fresh);
  // Hygiene: jangan biarkan map tumbuh tanpa batas.
  if (buckets.size > 20000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
      if (buckets.size <= 10000) break;
    }
  }
  return true;
}
