# Menyimpan Bukti Transfer di Telegram — RTKu

Alternatif **gratis 100%, tanpa kartu kredit**. Cara kerja: aplikasi punya bot
Telegram sendiri. Setiap warga mengunggah bukti transfer → bot menyimpan file
ke **channel pribadi milik Anda** → bendahara melihat bukti langsung di halaman
Validasi aplikasi (tanpa perlu buka Telegram).

Selama belum disambungkan, aplikasi tetap berjalan normal: bukti tersimpan
sementara di database.

## Yang perlu disiapkan (satu kali saja, ±5 menit)

### 1. Buat bot Telegram
1. Buka Telegram, cari **@BotFather** (akun resmi, ada centang biru).
2. Kirim perintah `/newbot`.
3. Ikuti pertanyaannya:
   - Nama bot: mis. `Bukti RTKu`
   - Username: mis. `rtku_bukti_bot` (harus unik, diakhiri `bot`)
4. BotFather membalas dengan **token** seperti `1234567890:AAH...xyz`.
   **Salin token ini — jangan dibagikan ke siapa pun.**

### 2. Buat channel pribadi untuk penyimpanan
1. Di Telegram: **☰ → New Channel** → nama: `Bukti Transfer RTKu`.
2. Pilih **Private Channel** → **Create**.
3. **Add Members**: cari username bot Anda → tambahkan → jadikan **Admin**
   (cukup hak "Post Messages", tidak perlu yang lain).

### 3. Dapatkan Chat ID channel
1. Cari **@getmyid_bot** di Telegram → **Start**.
2. **Forward** satu pesan apa pun dari channel `Bukti Transfer RTKu` ke @getmyid_bot.
3. Ia membalas dengan info chat — salin angka **Chat ID**-nya
   (diawali tanda minus, contoh: `-1001234567890`).

### 4. Masukkan ke Vercel
1. Buka dashboard Vercel → project **cluster** → **Settings** → **Environment Variables**.
2. Tambahkan dua variable (Environment: **Production**):
   | Key | Value |
   |-----|-------|
   | `TELEGRAM_BOT_TOKEN` | token dari @BotFather (langkah 1) |
   | `TELEGRAM_STORAGE_CHAT_ID` | Chat ID channel (langkah 3) |
3. **Deployments** → **⋯** pada deployment terbaru → **Redeploy**.

## Cara kerja setelah aktif

- Warga upload bukti → bot mengirim file ke channel `Bukti Transfer RTKu`
  (hanya Anda & admin channel yang bisa melihat isi channel).
- Di halaman **Validasi**, bendahara melihat pratinjau bukti + tombol
  **📁 Lihat Bukti (tersimpan di Telegram) ↗** — terbuka langsung di aplikasi,
  tanpa perlu login Telegram.
- Token bot tidak pernah terlihat di browser; file hanya bisa diakses lewat
  aplikasi oleh Bendahara/Pengurus yang sudah login.

## Catatan

- Batas file Telegram: 50 MB (aplikasi membatasi 5 MB per bukti).
- Bila ingin berhenti memakai Telegram: hapus kedua environment variable
  lalu redeploy — aplikasi otomatis kembali ke penyimpanan sementara.
- Jangan pernah membagikan `TELEGRAM_BOT_TOKEN` di chat atau ke orang lain.
  Jika token bocor, cabut lewat @BotFather → `/revoke`.
