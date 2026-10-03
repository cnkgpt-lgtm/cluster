# 🌿 RTKu — Aplikasi RT/R Perumahan

Aplikasi web untuk pengurus dan warga perumahan: kelola **iuran** (bayar via QRIS/VA/transfer manual + validasi bendahara + notifikasi), **pengumuman**, **CCTV lingkungan** yang bisa dipantau semua warga, **info warga**, dan **rekapitulasi kas**.

Stack: Next.js 15 (App Router) + Tailwind CSS v4 · PostgreSQL + Prisma · NextAuth v5 (RBAC) · Midtrans (QRIS & Virtual Account) · HLS.js · Cloudflare R2 · Vercel-ready.

## Role

| Role | Akses |
|---|---|
| **Warga** | Bayar iuran, lihat pengumuman/CCTV/info warga, notifikasi |
| **Pengurus** | Semua akses bendahara + kelola pengguna, kamera CCTV |
| **Bendahara** | Terbitkan tagihan, validasi bukti transfer, rekap kas & pengeluaran |
| **Sekretaris** | Tulis pengumuman (+ akses warga) |

## Fitur

- 🔐 Login + RBAC 4 role (otorisasi selalu dicek di server)
- 💳 Iuran: tagihan per periode → bayar via QRIS/VA (Midtrans Snap) atau transfer manual (unggah bukti)
- ✅ Validasi bendahara untuk transfer manual; notifikasi otomatis saat lunas / divalidasi / ditolak
- 🔔 Pusat notifikasi + badge jumlah belum dibaca
- 📢 Pengumuman (notifikasi otomatis ke warga saat terbit)
- 📹 CCTV: pemutar HLS (HLS.js), kelola kamera oleh pengurus, bisa dilihat semua warga
- 👥 Direktori warga + manajemen pengguna & role
- 💰 Rekapitulasi kas per bulan (pemasukan vs pengeluaran)

## Mulai cepat (development)

```bash
cp .env.example .env.local   # isi DATABASE_URL & AUTH_SECRET
npm install
npx prisma migrate dev       # atau: npx prisma db push
npm run db:seed
npm run dev
```

Buka http://localhost:3000 — tanpa kunci Midtrans, biarkan `MOCK_PAYMENT=true` untuk mencoba alur bayar lewat halaman simulasi.

Akun demo (dari seed): `pengurus@rtku.local` / `Pengurus123`, `bendahara@rtku.local` / `Bendahara123`, `sekretaris@rtku.local` / `Sekretaris123`, `warga@rtku.local` / `Warga123`.

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Build production (validasi) |
| `npm test` | Unit test (vitest): state machine pembayaran & webhook Midtrans |
| `npm run db:seed` | Isi data demo |
| `npx prisma studio` | GUI database |

## Keamanan pembayaran

- Nominal **selalu** diambil dari tagihan di server — body request client tidak dipercaya.
- Webhook `/api/webhooks/midtrans`: verifikasi signature SHA-512 **fail-closed**, dedupe via `transaction_id` (idempoten), verifikasi nominal cocok dengan catatan server.
- State machine: `PENDING → PAID | FAILED | EXPIRED | MENUNGGU_VALIDASI`; `MENUNGGU_VALIDASI → PAID | DITOLAK`; status terminal tidak bisa berubah.
- Secret server tidak pernah diawali `NEXT_PUBLIC_`.

## Deploy

Lihat **[DEPLOY.md](DEPLOY.md)** — GitHub → Vercel → env vars → migrate → seed → Midtrans & CCTV.

## Struktur

```
src/
  app/
    (app)/            halaman terproteksi (dashboard, iuran, cctv, kas, ...)
    api/              route handlers (pembayaran, webhooks/midtrans, cctv, ...)
    login/            halaman login
  components/         Sidebar, BayarForm, CctvPlayer, ...
  lib/                db, authz, midtrans, pembayaran(+state machine), r2, notifikasi, format
prisma/               schema.prisma, seed.ts
tests/                unit test vitest
```
