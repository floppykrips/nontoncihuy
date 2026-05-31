# 🎬 NontoCihuy — Panduan Setup & Deploy

## Struktur Proyek

```
nontoncihuy-v3/
├── api/
│   ├── _db.js          ← koneksi MongoDB (shared)
│   ├── _auth.js        ← cek password admin
│   ├── films.js        ← GET semua film / POST tambah film
│   └── films/
│       └── [id].js     ← PUT edit / DELETE hapus film
├── public/
│   ├── index.html      ← halaman utama
│   ├── admin.html      ← panel admin (password protected)
│   ├── script.js       ← logika frontend
│   └── style.css       ← tampilan
├── package.json
├── vercel.json         ← konfigurasi Vercel
└── SETUP.md            ← panduan ini
```

---

## LANGKAH 1 — Buat Database di MongoDB Atlas

1. Buka **https://cloud.mongodb.com** → daftar/login (gratis)
2. Klik **"Build a Database"** → pilih **M0 Free**
3. Pilih region terdekat (Singapore atau Tokyo)
4. Buat username & password database — **catat password-nya!**
5. Di bagian **"Where would you like to connect from?"** → pilih **"My Local Environment"** → tambahkan IP `0.0.0.0/0` (allow all)
6. Klik **"Connect"** → **"Connect your application"** → copy connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```
   Ganti `<username>` dan `<password>` dengan yang tadi dibuat.

---

## LANGKAH 2 — Deploy ke Vercel

### A. Install Vercel CLI (kalau belum)
```bash
npm install -g vercel
```

### B. Login Vercel
```bash
vercel login
```

### C. Deploy dari folder proyek
```bash
cd nontoncihuy-v3
vercel
```
Ikuti instruksinya:
- Set up and deploy? → **Y**
- Which scope? → pilih akun lo
- Link to existing project? → **N**
- Project name → **nontoncihuy** (atau bebas)
- In which directory is your code? → **.** (titik = folder ini)

### D. Setelah deploy, set Environment Variables
```bash
vercel env add MONGODB_URI
# paste connection string MongoDB Atlas lo

vercel env add ADMIN_SECRET
# ketik password admin yang lo mau (bebas, contoh: SuperRahasia123!)

vercel env add DB_NAME
# ketik: nontoncihuy
```

### E. Redeploy biar env vars aktif
```bash
vercel --prod
```

---

## LANGKAH 3 — Selesai! 🎉

Website lo sekarang live di:
- **https://nontoncihuy.vercel.app** (nama proyek lo)

Admin panel:
- Buka `/admin.html`
- Masukkan `ADMIN_SECRET` yang tadi lo set
- Tambah film → langsung muncul ke semua pengunjung ✅

---

## Cara Kerja

```
Pengunjung buka website
      ↓
script.js fetch TMDb API (film publik)
      ↓
script.js JUGA fetch /api/films (film custom lo)
      ↓
Film custom muncul DI ATAS film TMDb
      ↓
Semua orang lihat hal yang sama ✅
```

---

## Tips

**Kategori film:**
| Kategori   | Muncul di                    |
|------------|------------------------------|
| `trending` | 🔥 Trending di Beranda       |
| `terbaru`  | ✨ Film Terbaru di Beranda   |
| `top`      | ⭐ Rating Tertinggi          |
| `serial`   | 📺 Halaman Serial            |
| `featured` | 🌟 Hero banner di Beranda    |

**Video URL yang didukung:**
- YouTube: `https://youtube.com/watch?v=xxxxx` → auto-embed player
- YouTube pendek: `https://youtu.be/xxxxx` → auto-embed
- Google Drive (share link → embed URL)
- Link video langsung (`.mp4`, dll)
- Kosongkan jika belum ada video

**Password aman:** Pakai kombinasi huruf + angka + simbol untuk `ADMIN_SECRET`.

---

## Troubleshooting

**"Gagal memuat dari server"** di admin panel:
→ Cek MONGODB_URI sudah benar di Vercel Dashboard → Settings → Environment Variables
→ Pastikan IP `0.0.0.0/0` sudah di-allow di MongoDB Atlas Network Access

**Film tidak muncul di website:**
→ Pastikan kategori film sudah benar
→ Coba refresh halaman

**Error 401 saat login admin:**
→ Password yang lo masukkan tidak cocok dengan `ADMIN_SECRET` di Vercel

---

## Update Website

Kalau mau update file (style, script, dll):
```bash
vercel --prod
```
