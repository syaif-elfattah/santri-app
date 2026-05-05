# 🕌 Database Prestasi & Keaktifan Santri

Aplikasi web untuk mencatat keaktifan dan prestasi santri per kelas.
Musyrif bisa langsung input tanpa login. Admin perlu login untuk kelola data santri dan ekspor LPJ.

---

## 📁 Struktur File

```
santri-app/
├── app/
│   ├── page.tsx                  ← Beranda (pilih musyrif/admin)
│   ├── input/page.tsx            ← Halaman input prestasi (musyrif)
│   ├── admin/
│   │   ├── page.tsx              ← Halaman login admin
│   │   ├── layout.tsx            ← Layout admin + sidebar
│   │   ├── dashboard/page.tsx    ← Dashboard rekap
│   │   ├── kelas/page.tsx        ← Kelola kelas
│   │   ├── santri/page.tsx       ← Kelola data santri (paste Excel)
│   │   └── prestasi/page.tsx     ← Edit/hapus data prestasi
│   └── api/
│       ├── auth/login/route.ts   ← POST login
│       ├── auth/session/route.ts ← GET cek sesi, DELETE logout
│       ├── kelas/route.ts        ← CRUD kelas
│       ├── santri/route.ts       ← CRUD santri (+ bulk paste)
│       └── prestasi/
│           ├── route.ts          ← CRUD prestasi
│           └── export/route.ts   ← GET ekspor Excel LPJ
├── lib/
│   ├── supabase.ts               ← Supabase client
│   └── auth.ts                   ← JWT session helper
└── scripts/
    └── setup-admin.js            ← Setup password admin pertama kali
```

---

## 🚀 Cara Setup (langkah demi langkah)

### 1. Buat project Supabase

1. Buka https://app.supabase.com → New Project
2. Catat: **Project URL** dan **anon key** dan **service_role key**
3. Buka **SQL Editor** → paste isi file `supabase_schema.sql` → Run

### 2. Clone & install

```bash
git clone <repo-url> santri-app
cd santri-app
npm install
```

### 3. Konfigurasi environment

```bash
cp .env.example .env.local
# Edit .env.local, isi ketiga nilai dari Supabase dan buat JWT secret
```

Isi `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_JWT_SECRET=buat-string-acak-minimal-32-karakter
ADMIN_PASSWORD_AWAL=passwordpilihananda
```

### 4. Setup password admin

```bash
npm run setup-admin
```

Output yang diharapkan:
```
✅ Admin berhasil dikonfigurasi!
   Username : admin
   Password : passwordpilihananda
```

Setelah ini **hapus baris ADMIN_PASSWORD_AWAL** dari `.env.local`.

### 5. Jalankan lokal

```bash
npm run dev
# Buka http://localhost:3000
```

---

## ☁️ Deploy ke Vercel + Supabase (gratis)

### 1. Push ke GitHub

```bash
git init && git add . && git commit -m "first commit"
gh repo create santri-app --public --push
```

### 2. Deploy di Vercel

1. Buka https://vercel.com → Add New Project → import repo
2. Di **Environment Variables**, tambahkan semua isi `.env.local`
3. Klik Deploy — selesai!

### 3. Setup admin di production

Setelah deploy, jalankan sekali:
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_PASSWORD_AWAL=... node scripts/setup-admin.js
```

---

## 👥 Cara Pakai

### Musyrif (tanpa login)
1. Buka URL website
2. Klik **Input Prestasi & Keaktifan**
3. Pilih kelas → pilih santri → isi form → simpan
4. Tag kegiatan tersedia untuk pilih cepat

### Admin
1. Klik **Panel Admin** → login dengan username/password
2. **Kelas** — tambah/hapus kelas
3. **Data Santri** — paste dari Excel langsung (Ctrl+C dari Excel → Ctrl+V di zona paste)
4. **Prestasi** — edit/hapus data yang diinput musyrif
5. **Dashboard** — lihat rekap & klik **Ekspor Excel LPJ**

---

## 🔑 Hak Akses

| Fitur                    | Musyrif | Admin |
|--------------------------|:-------:|:-----:|
| Input prestasi           | ✅      | ✅    |
| Edit prestasi sendiri    | ✅      | ✅    |
| Hapus prestasi           | ❌      | ✅    |
| Lihat data santri        | ✅      | ✅    |
| Tambah/edit/hapus santri | ❌      | ✅    |
| Kelola kelas             | ❌      | ✅    |
| Ekspor Excel LPJ         | ❌      | ✅    |
| Dashboard rekap          | ❌      | ✅    |

---

## 🗄️ Struktur Database

```
kelas          → id, nama, urutan
santri         → id, kelas_id, no_urut, nama, keterangan, aktif
prestasi       → id, santri_id, kegiatan_sekolah, kegiatan_pondok,
                  prestasi_sekolah, prestasi_pondok, progres_pribadi
admin_config   → id(=1), username, password_hash
```

View `rekap_santri` menggabungkan ketiga tabel untuk dashboard.
