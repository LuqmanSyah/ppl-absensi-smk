# Sistem Absensi Digital Siswa SMK Putra Perdana Indonesia

Aplikasi web untuk mencatat kehadiran siswa menggunakan **QR Code** dan **validasi lokasi GPS**. Proyek ini disusun berdasarkan dokumen SRS (IEEE 830) Kelompok 7, mata kuliah Pengembangan Perangkat Lunak, Universitas Esa Unggul.

## Latar Belakang

Mesin fingerprint di sekolah sering gagal membaca sidik jari dan pemantauan kehadiran masih dilakukan secara manual. Sistem ini menggantikannya dengan absensi berbasis web yang:

- mencatat jam masuk dan pulang secara real-time,
- membatasi absensi hanya di area sekolah (geofencing),
- menentukan status Hadir atau Terlambat secara otomatis (batas 5 menit),
- menyediakan dashboard dan rekap kehadiran untuk sekolah dan orang tua.

## Peran Pengguna

| Peran | Kegunaan |
|---|---|
| Admin (TU) | Mengelola data siswa, akun, jadwal, lokasi sekolah, dan melihat laporan |
| Guru | Membuka sesi absensi (membuat QR Code) dan memantau kehadiran siswa |
| Siswa | Check-in dan check-out dengan scan QR + GPS, mengajukan izin atau sakit, melihat riwayat |
| Orang Tua | Memantau riwayat kehadiran anak |

## Fitur Utama

Status pengerjaan mengikuti rencana sprint di bawah. Centang diperbarui seiring pengembangan.

- [x] Login akun individual dengan pembatasan hak akses per peran
- [x] Kelola data master (siswa, akun, jadwal, lokasi sekolah)
- [ ] Guru membuka sesi absensi dan menampilkan QR Code
- [ ] Siswa check-in/check-out dengan scan QR dan GPS
- [ ] Validasi jadwal, waktu server, lokasi (radius dan akurasi GPS), serta duplikasi
- [ ] Status Hadir/Terlambat otomatis (batas 5 menit)
- [ ] Pengajuan izin atau sakit dengan konfirmasi
- [ ] Dashboard kehadiran real-time dan rekap laporan
- [ ] Deteksi siswa keluar area sekolah
- [ ] Pencatatan aktivitas pengguna (audit log)

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Validasi | Zod |
| Autentikasi | Sesi JWT dengan `jose`, hash password dengan `argon2` |
| QR Code | `qrcode` (generate), `html5-qrcode` (scan) |
| Logging | `pino` |

## Prasyarat

Pastikan sudah terpasang:

- [Node.js](https://nodejs.org/) versi LTS terbaru
- [Docker](https://www.docker.com/) dengan Docker Compose (untuk database lokal)
- [Git](https://git-scm.com/)

## Cara Menjalankan

### 1. Clone repository

```bash
git clone https://github.com/<username>/absensi-smk.git
cd absensi-smk
```

### 2. Siapkan environment

```bash
cp .env.example .env
```

Lalu buka `.env` dan isi `AUTH_SECRET` dengan string acak:

```bash
openssl rand -base64 32
```

Alternatif jika `openssl` tidak tersedia:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Jalankan database

```bash
docker compose up -d
docker compose ps        # tunggu sampai status healthy
```

> Pengguna Podman (misalnya Fedora) bisa mengganti `docker compose` dengan `podman compose`.

### 4. Pasang dependensi

```bash
npm install              # otomatis menjalankan `prisma generate`
```

### 5. Siapkan database

```bash
npx prisma migrate dev   # menjalankan migrasi yang sudah ada di prisma/migrations
npx prisma db seed       # mengisi data contoh untuk development
```

Akun hasil seed (password semua akun: `password123`, **hanya untuk development**):

| Peran | Username |
|---|---|
| Admin/TU | `admin` |
| Guru | `guru1`, `guru2` |
| Orang Tua | `ortu1`, `ortu2` |
| Siswa | `2024001` sampai `2024006` (NIS) |

Prisma Client di-generate ke `src/generated/prisma` (tidak di-commit). Jalankan `npx prisma generate` setiap kali `schema.prisma` berubah.

### 6. Jalankan aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

> **Penting:** kamera (scan QR) dan GPS hanya bisa diakses browser lewat **HTTPS** atau `localhost`. Untuk mencoba dari HP saat development, gunakan tunnel HTTPS (misalnya Cloudflare Tunnel atau ngrok), bukan alamat IP lokal biasa.

## Variabel Environment

| Variabel | Keterangan | Contoh |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://absensi:absensi@localhost:5432/absensi` |
| `AUTH_SECRET` | Kunci rahasia penandatangan sesi/JWT | hasil `openssl rand -base64 32` |
| `APP_TIMEZONE` | Zona waktu sekolah untuk perhitungan keterlambatan | `Asia/Jakarta` |

Jangan pernah meng-commit file `.env`. Gunakan `.env.example` sebagai acuan bagi anggota tim.

## Perintah yang Tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan server development |
| `npm run build` | Build untuk production |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | Mengecek kode dengan ESLint |
| `npx prisma migrate dev` | Membuat dan menjalankan migrasi database |
| `npx prisma db seed` | Mengisi data contoh untuk development |
| `npx prisma studio` | Membuka antarmuka untuk melihat isi database |
| `docker compose up -d` | Menjalankan PostgreSQL |
| `docker compose down` | Menghentikan PostgreSQL (data tetap aman) |
| `docker compose down -v` | Menghentikan dan menghapus data database |

## Struktur Folder

```
absensi-smk/
├── prisma/
│   ├── schema.prisma        # Model data (dari class diagram SRS)
│   ├── seed.ts              # Data contoh untuk development
│   └── migrations/
├── prisma.config.ts         # Konfigurasi Prisma CLI
├── src/
│   ├── app/                 # Halaman dan route handler (App Router)
│   ├── components/          # Komponen UI (shadcn/ui)
│   └── lib/                 # Helper: prisma client, geofencing, auth, dll
├── docs/                    # Perencanaan dan dokumentasi database
├── docker-compose.yml       # PostgreSQL lokal
├── .env.example
└── README.md
```

## Aturan Bisnis Penting

- Semua waktu kehadiran ditentukan dari **waktu server**, bukan dari perangkat pengguna.
- Absensi ditolak jika di luar radius sekolah atau akurasi GPS terlalu rendah.
- Siswa dianggap **Terlambat** jika check-in melewati 5 menit dari waktu mulai sesi.
- Semua validasi (token QR, jadwal, lokasi, duplikasi) dilakukan di sisi server.

## Metode dan Rencana Pengembangan

Metode pengembangan: **Agile Scrum** (3 sprint, tiap sprint 2 pertemuan).

| Sprint | Pertemuan | Cakupan |
|---|---|---|
| Sprint 1 | 8–9 | Akun, login, role, data master |
| Sprint 2 | 10–11 | Absensi QR Code dan GPS, validasi, status, izin/sakit |
| Sprint 3 | 12–13 | Dashboard, rekap, deteksi keluar area, pengujian akhir |
| Presentasi | 14 | Demo dan presentasi |

## Alur Kerja Git (Tim)

- Branch `main` hanya berisi kode yang sudah stabil.
- Setiap fitur dikerjakan di branch terpisah, contoh: `feat/login`, `feat/scan-qr`, `fix/geofence-radius`.
- Gabungkan ke `main` lewat Pull Request dan minta review minimal satu anggota.
- Format pesan commit: `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`.

## Pemecahan Masalah

**Port 5432 sudah dipakai.** Ubah mapping di `docker-compose.yml` menjadi `"5433:5432"` dan sesuaikan port pada `DATABASE_URL`.

**Prisma tidak membaca `DATABASE_URL`.** Pastikan `prisma.config.ts` memiliki `import "dotenv/config";` di baris paling atas dan file `.env` berada di root project.

**Kamera atau lokasi tidak muncul di HP.** Akses harus lewat HTTPS atau `localhost`, dan izin kamera/lokasi di browser harus diizinkan.

**Error setelah mengubah `schema.prisma`.** Buat migrasi dengan `npx prisma migrate dev --name <nama-perubahan>`, lalu jalankan `npx prisma generate`.

## Tim Pengembang (Kelompok 7)

| Nama | NIM |
|---|---|
| Luqman Syahreno | 20240801016 |
| Muhammad Aditya | 20240801234 |
| Angga Aditya Nugraha | 20240801165 |
| Fadhil Afiq Badruzzaman | 20240801119 |
| Rizqi Bagas Wicaksono | 20240801187 |
| Fiery Ardiansyah | 20240801092 |

Dosen Pengampu: Qori Halimatul Hidayah, S.Pd., M.Kom.