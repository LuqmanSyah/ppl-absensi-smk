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
- [x] Guru membuka sesi absensi dan menampilkan QR Code
- [x] Siswa check-in/check-out dengan scan QR dan GPS
- [x] Validasi jadwal, waktu server, lokasi (radius dan akurasi GPS), serta duplikasi
- [x] Status Hadir/Terlambat otomatis (batas 5 menit)
- [x] Pengajuan izin atau sakit dengan konfirmasi
- [x] Dashboard kehadiran real-time dan rekap laporan
- [x] Absen selesai pelajaran (validasi lokasi menjelang akhir pelajaran, pengganti deteksi keluar area berkala)
- [x] Pencatatan aktivitas pengguna (audit log)

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
| `APP_URL` | Opsional. Alamat aplikasi yang ditulis di QR Code. Kosongkan untuk memakai alamat yang sedang dibuka | `https://absensi.contoh.id` |
| `LATE_AFTER_MINUTES` | Opsional. Batas menit sebelum siswa dianggap Terlambat | `5` |
| `MAX_GPS_ACCURACY_M` | Opsional. Akurasi GPS terburuk yang diterima (meter) | `50` |
| `OPEN_SESSION_EARLY_MINUTES` | Opsional. Guru boleh membuka sesi N menit sebelum jam mulai | `15` |
| `CHECKOUT_AFTER_PERCENT` | Opsional. Absen selesai dibuka setelah sekian persen durasi pelajaran | `66.67` |
| `CHECKOUT_GRACE_MINUTES` | Opsional. Absen selesai masih diterima N menit setelah jam pelajaran berakhir | `10` |

Jangan pernah meng-commit file `.env`. Gunakan `.env.example` sebagai acuan bagi anggota tim.

## Perintah yang Tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan server development |
| `npm run build` | Build untuk production |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | Mengecek kode dengan ESLint |
| `npm test` | Menjalankan unit test (Haversine, status Terlambat, jendela absen selesai, zona waktu) |
| `npm run db:backup` | Membuat backup database ke folder `backups/` (lihat bagian Backup) |
| `npm run test:e2e` | Menjalankan pengujian end-to-end (lihat bagian Pengujian) |
| `npx prisma migrate dev` | Membuat dan menjalankan migrasi database |
| `npx prisma db seed` | Mengisi data contoh untuk development |
| `npx prisma studio` | Membuka antarmuka untuk melihat isi database |
| `docker compose up -d` | Menjalankan PostgreSQL |
| `docker compose down` | Menghentikan PostgreSQL (data tetap aman) |
| `docker compose down -v` | Menghentikan dan menghapus data database |

## Pengujian

### Unit test

```bash
npm test
```

Menguji fungsi murni tanpa database: rumus Haversine dan validasi lokasi, penentuan Hadir/Terlambat, jendela waktu membuka sesi, dan konversi zona waktu. Memakai test runner bawaan Node.js (`node:test`). File tes berada di samping kodenya dengan akhiran `.test.ts`.

### Pengujian end-to-end (E2E) otomatis

Pengujian E2E memakai [Playwright](https://playwright.dev/). Playwright membuka browser sungguhan, login, mengisi form, dan mengklik tombol seperti pengguna, lalu memeriksa hasilnya. Skenarionya sama dengan checklist manual di `docs/testing-sprint-1.md` sampai `docs/testing-sprint-3.md` (nomor uji seperti `L-01` dan `D-03` tercantum di nama tes).

Persiapan satu kali (mengunduh browser Chromium, sekitar 120 MB):

```bash
npx playwright install chromium
```

Menjalankan tes (pastikan database Docker/Podman sudah berjalan):

```bash
npm run test:e2e           # semua tes, sekitar 1-2 menit termasuk build
npm run test:e2e:ui        # mode interaktif, bisa melihat browser langkah demi langkah
npm run test:e2e:report    # membuka laporan HTML hasil terakhir
npx playwright test e2e/04-students.spec.ts   # hanya satu file
```

Yang terjadi saat tes dijalankan:
- Database terpisah `absensi_e2e` dibuat ulang dari nol (migrasi + seed). **Database development `absensi` tidak tersentuh.**
- Aplikasi di-build lalu dijalankan di port `3200`, jadi `npm run dev` di port 3000 boleh tetap menyala.
- Tes berjalan di layar desktop, dan `e2e/mobile.spec.ts` di layar HP (Pixel 7).
- Tes absensi membuat kelas uji `XII E2E` dengan jadwal yang sedang berlangsung dan memalsukan posisi GPS browser. Karena bergantung pada jam, tes absensi dilewati otomatis antara pukul 22:50 dan 00:20 WIB.
- Jika ada yang gagal, screenshot dan rekaman langkah tersimpan di `test-results/`. Buka dengan `npm run test:e2e:report`.

Jalankan `npm run test:e2e` sebelum membuat Pull Request. Saat menambah fitur baru, tambahkan juga tesnya di folder `e2e/`.

## Backup dan Pemeliharaan

**Backup database** (NFR-04):

```bash
npm run db:backup                          # simpan ke ./backups, 14 backup terakhir disimpan
BACKUP_DIR=/mnt/backup KEEP=30 npm run db:backup
```

Skrip memakai `pg_dump` jika terpasang, atau menjalankannya di dalam container `absensi-db` (Docker/Podman). Untuk memulihkan:

```bash
pg_restore --clean --no-owner -d "$DATABASE_URL" backups/absensi-YYYYMMDD-HHMMSS.dump
```

Contoh jadwal backup harian dengan `crontab -e` di server:

```cron
0 2 * * * cd /path/ke/absensi-smk && npm run db:backup >> backups/backup.log 2>&1
```

Simpan salinan backup di tempat lain (misalnya Google Drive atau server lain), bukan hanya di server yang sama.

**Memasang aplikasi di HP (PWA):** buka aplikasi lewat HTTPS di Chrome Android, lalu menu ⋮ → **Tambahkan ke layar utama** / **Instal aplikasi**. Di iPhone: Safari → tombol Bagikan → **Tambah ke Layar Utama**.

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
├── e2e/                     # Pengujian end-to-end (Playwright)
├── scripts/                 # Backup database
├── docker-compose.yml       # PostgreSQL lokal
├── .env.example
└── README.md
```

## Aturan Bisnis Penting

- Semua waktu kehadiran ditentukan dari **waktu server**, bukan dari perangkat pengguna.
- Absensi ditolak jika di luar radius sekolah atau akurasi GPS terlalu rendah.
- Siswa dianggap **Terlambat** jika check-in melewati 5 menit dari waktu mulai sesi.
- Siswa melakukan **absen selesai** dengan scan QR yang sama setelah 2/3 jam pelajaran berlalu (sampai 10 menit setelah pelajaran berakhir). Siswa yang hadir tetapi tidak absen selesai tetap dihitung hadir, dengan tanda "Tidak absen selesai" di laporan.
- Semua validasi (token QR, jadwal, lokasi, duplikasi) dilakukan di sisi server.

## Metode dan Rencana Pengembangan

Metode pengembangan: **Agile Scrum** (3 sprint, tiap sprint 2 pertemuan).

| Sprint | Pertemuan | Cakupan |
|---|---|---|
| Sprint 1 | 8–9 | Akun, login, role, data master |
| Sprint 2 | 10–11 | Absensi QR Code dan GPS, validasi, status, izin/sakit |
| Sprint 3 | 12–13 | Dashboard, rekap, absen selesai, pengujian akhir |
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