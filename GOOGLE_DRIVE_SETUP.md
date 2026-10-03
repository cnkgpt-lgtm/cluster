# Menyambungkan Google Drive untuk Bukti Transfer — RTKu

Dengan integrasi ini, setiap warga mengunggah bukti transfer → file tersimpan otomatis
di **folder Google Drive milik Anda** → bendahara mendapat **link Google Drive**
yang bisa langsung dibuka di halaman Validasi.

Selama belum disambungkan, aplikasi tetap berjalan normal: bukti tersimpan
sementara di database (tanpa perlu pengaturan apa pun).

## Yang perlu disiapkan (satu kali saja, ±10 menit)

### 1. Buat project di Google Cloud
1. Buka **https://console.cloud.google.com**
2. Login dengan akun Google Anda.
3. Klik daftar project di bilah atas → **New Project** → beri nama mis. `RTKu` → **Create**.
4. Pastikan project `RTKu` yang aktif (terlihat di bilah atas).

### 2. Aktifkan Google Drive API
1. Menu ☰ → **APIs & Services** → **Library**.
2. Cari **Google Drive API** → klik → **Enable**.

### 3. Buat Service Account (akun robot untuk aplikasi)
1. Menu ☰ → **APIs & Services** → **Credentials**.
2. **+ Create Credentials** → **Service account**.
3. Service account name: `rtku-uploader` → **Create** → **Continue** → **Done**.
   (Langkah "Grant access" boleh dilewati.)

### 4. Unduh kunci (file JSON)
1. Di daftar **Service Accounts**, klik email `rtku-uploader@...iam.gserviceaccount.com`.
2. Tab **Keys** → **Add Key** → **Create new key** → pilih **JSON** → **Create**.
3. File JSON terunduh — **simpan baik-baik, jangan dibagikan**.
4. Buka file JSON tersebut dengan Notepad. Catat dua nilai:
   - `client_email` (contoh: `rtku-uploader@rtku-123456.iam.gserviceaccount.com`)
   - `private_key` (teks panjang diawali `-----BEGIN PRIVATE KEY-----`)

### 5. Buat folder di Google Drive & bagikan ke service account
1. Buka **https://drive.google.com** (akun Google Anda).
2. **+ New** → **New folder** → nama: `Bukti Transfer RTKu` → **Create**.
3. Klik kanan folder tersebut → **Share** → **Share**.
4. Tempel **email service account** dari langkah 4 (`client_email`).
5. Ubah peran menjadi **Editor** → **Send**.
6. Buka folder tersebut, salin **Folder ID** dari address bar browser:
   `https://drive.google.com/drive/folders/`**`1AbC...XyZ`** ← inilah Folder ID-nya.

### 6. Masukkan ke Vercel
1. Buka dashboard Vercel → project **cluster** → **Settings** → **Environment Variables**.
2. Tambahkan tiga variable (Environment: **Production**):
   | Key | Value |
   |-----|-------|
   | `GOOGLE_DRIVE_CLIENT_EMAIL` | `client_email` dari file JSON |
   | `GOOGLE_DRIVE_PRIVATE_KEY` | seluruh isi `private_key` dari file JSON (termasuk `-----BEGIN/END-----`) |
   | `GOOGLE_DRIVE_FOLDER_ID` | Folder ID dari langkah 5 |
3. **Deployments** → **⋯** pada deployment terbaru → **Redeploy**.

## Cara kerja setelah aktif

- Warga upload bukti → file masuk ke folder `Bukti Transfer RTKu` di Drive Anda
  (nama file otomatis: `bukti-2026-10-04-<acak>.jpg`).
- File otomatis diset **"siapa pun yang memiliki link dapat melihat"**,
  sehingga bendahara bisa langsung membuka link tanpa login tambahan.
- Di halaman **Validasi**, bendahara melihat pratinjau + tombol
  **📁 Lihat Bukti di Google Drive ↗**.

## Catatan

- Link bersifat acak dan panjang sehingga tidak bisa ditebak; hanya yang
  menerima link (bendahara/pengurus lewat aplikasi) yang bisa membukanya.
- Bila suatu saat ingin mencabut: hapus file/folder di Drive, atau hapus
  ketiga environment variable lalu redeploy — aplikasi otomatis kembali
  ke penyimpanan sementara di database.
- Jangan pernah membagikan isi `private_key` di chat atau ke orang lain.
