# Panduan Deploy RTKu ke Vercel

Panduan ini membawa aplikasi **RTKu — Aplikasi RT/R Perumahan** dari folder ini sampai live di Vercel.

**Yang dibutuhkan:**
1. Akun GitHub
2. Akun Vercel (login dengan GitHub)
3. Database PostgreSQL gratis — pilih salah satu:
   - [Neon](https://neon.tech) (disarankan, gratis, cepat), atau
   - [Supabase](https://supabase.com) (pakai *Connection string* mode Session/pooler)
4. (Opsional) Akun [Midtrans](https://midtrans.com) untuk pembayaran QRIS/VA sungguhan
5. (Opsional) Akun [Cloudflare R2](https://cloudflare.com) untuk penyimpanan bukti transfer

> Tanpa Midtrans pun aplikasi bisa dicoba: aktifkan `MOCK_PAYMENT=true` untuk mode simulasi pembayaran.

---

## Langkah 1 — Push ke GitHub

```bash
cd rt-perumahan
git init
git add .
git commit -m "RTKu v1.0 - Aplikasi RT/R Perumahan"
git branch -M main
git remote add origin https://github.com/USERNAME/rtku-perumahan.git
git push -u origin main
```

> Ganti `USERNAME` dengan username GitHub Anda. Buat repository kosong dulu di github.com/new (jangan centang "Add a README").

## Langkah 2 — Import ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new), pilih repository `rtku-perumahan` → **Import**.
2. Framework Preset otomatis terdeteksi **Next.js**. Biarkan default.
3. **Jangan deploy dulu** — isi Environment Variables dulu (langkah 3).

## Langkah 3 — Environment Variables

Di halaman import (atau **Settings → Environment Variables**), isi:

| Nama | Wajib | Contoh / Cara isi |
|---|---|---|
| `DATABASE_URL` | Ya | Connection string Postgres dari Neon/Supabase |
| `AUTH_SECRET` | Ya | String acak 32+ karakter. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_API_KEY` | Ya | String acak lain, mis. hasil `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Ya | URL Vercel Anda, mis. `https://rtku-perumahan.vercel.app` |
| `MIDTRANS_SERVER_KEY` | Jika bayar online | Dari dashboard Midtrans (Settings → Access Keys) |
| `MIDTRANS_CLIENT_KEY` | Jika bayar online | Dari dashboard Midtrans |
| `MIDTRANS_ENV` | Opsional | `sandbox` (default) atau `production` |
| `MOCK_PAYMENT` | Opsional | `true` untuk simulasi tanpa Midtrans |
| `R2_ACCOUNT_ID` | Opsional | ID akun Cloudflare |
| `R2_ACCESS_KEY_ID` | Opsional | R2 API token — Access Key |
| `R2_SECRET_ACCESS_KEY` | Opsional | R2 API token — Secret Key |
| `R2_BUCKET` | Opsional | Nama bucket, mis. `rtku-bukti` |
| `R2_PUBLIC_URL` | Opsional | Domain publik bucket, mis. `https://pub-xxx.r2.dev` |

> ⚠️ Secret yang diawali `NEXT_PUBLIC_` akan terlihat di browser. Jangan pernah menaruh `MIDTRANS_SERVER_KEY`, `DATABASE_URL`, atau `AUTH_SECRET` dengan prefix itu.

## Langkah 4 — Database: migrasi otomatis & seed

**Migrasi berjalan otomatis** setiap deploy: build command di `package.json` adalah
`prisma migrate deploy && prisma generate && next build`, jadi tabel database
terbentuk sendiri saat Vercel membangun aplikasi (selama `DATABASE_URL` terisi).

**Seed data demo** (akun demo + tagihan contoh) dijalankan sekali via endpoint khusus:

```bash
curl -X POST https://DOMAIN_ANDA/api/admin/seed \
  -H "x-api-key: ISI_NEXTAUTH_API_KEY_ANDA"
```

Endpoint ini idempoten (aman dipanggil ulang) dan hanya bisa diakses dengan API key server.
Setelah seed berhasil, segera nonaktifkan/ganti kata sandi akun demo.

> Alternatif manual dari komputer: `npx prisma migrate deploy && npm run db:seed`
> (butuh `.env` lokal berisi `DATABASE_URL` yang sama).

## Langkah 5 — Deploy & verifikasi

1. Klik **Deploy** di Vercel, tunggu status **Ready**.
2. Buka URL aplikasi → halaman login muncul.
3. Login dengan akun demo (dibuat oleh seed):
   - Pengurus: `pengurus@rtku.local` / `Pengurus123`
   - Bendahara: `bendahara@rtku.local` / `Bendahara123`
   - Sekretaris: `sekretaris@rtku.local` / `Sekretaris123`
   - Warga: `warga@rtku.local` / `Warga123`
4. **Segera ganti kata sandi / nonaktifkan akun demo** setelah membuat akun asli di menu **Pengguna** (login sebagai Pengurus).

## Langkah 6 — Midtrans (pembayaran sungguhan)

1. Daftar di [midtrans.com](https://midtrans.com), ambil **Server Key** & **Client Key** (mulai dari *Sandbox*).
2. Isi `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, set `MOCK_PAYMENT=false` (atau hapus).
3. Di dashboard Midtrans → **Settings → Configuration**, isi:
   - Payment Notification URL: `https://DOMAIN_ANDA/api/webhooks/midtrans`
   - Finish/Unfinish/Error URL: `https://DOMAIN_ANDA/iuran`
4. Untuk production: ganti `MIDTRANS_ENV=production` dan pakai production keys.

## CCTV — menghubungkan DVR/NVR Hikvision/Dahua

Browser hanya bisa memutar **HLS (.m3u8)**, sedangkan DVR/NVR umumnya mengeluarkan **RTSP**. Solusinya: jalankan gateway RTSP→HLS di jaringan lokal perumahan, contoh dengan [MediaMTX](https://github.com/bluenviron/mediamtx):

```yaml
# mediamtx.yml (contoh)
paths:
  gerbang:
    source: rtsp://admin:password@192.168.1.64:554/Streaming/Channels/101
```

Lalu di menu **CCTV** (login sebagai Pengurus) → Tambah Kamera → isi URL HLS-nya, mis. `http://IP_GATEWAY:8888/gerbang/index.m3u8`.

> Agar bisa diakses dari internet, gateway perlu diekspos dengan aman (VPN / reverse proxy + autentikasi). Jangan mengekspos RTSP langsung ke publik.

## Penyimpanan bukti transfer (R2)

1. Cloudflare Dashboard → **R2** → buat bucket (mis. `rtku-bukti`).
2. **Manage R2 API Tokens** → buat token dengan izin baca-tulis ke bucket tersebut.
3. Isi 4 env `R2_*` di Vercel. Untuk akses publik, aktifkan **Custom Domain / Public Development URL** lalu isi `R2_PUBLIC_URL`.
4. Tanpa R2, bukti tersimpan lokal (`public/uploads`) — hanya cocok untuk development, **tidak untuk production** (filesystem Vercel bersifat ephemeral).

## Troubleshooting

| Gejala | Penyebab umum |
|---|---|
| Build gagal `P1001`/koneksi DB | `DATABASE_URL` salah / IP belum di-allowlist di Neon/Supabase |
| Login selalu gagal | `AUTH_SECRET` belum diisi atau seed belum dijalankan |
| Webhook Midtrans 401 | `MIDTRANS_SERVER_KEY` tidak cocok dengan dashboard Midtrans |
| CCTV tidak memutar | URL bukan HLS, atau kamera hanya bisa diakses dari LAN |
| Upload bukti gagal di Vercel | Wajar tanpa R2 — filesystem Vercel tidak persisten |

---

**Checklist go-live:** akun demo diganti/dinonaktifkan ☐ · `MOCK_PAYMENT=false` ☐ · webhook Midtrans terdaftar ☐ · R2 terisi ☐ · kamera CCTV menunjuk URL HLS asli ☐
