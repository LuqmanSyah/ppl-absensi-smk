# Perencanaan Pengembangan

Sistem Absensi Digital Siswa SMK Putra Perdana Indonesia, Kelompok 7. Perencanaan ini mengikuti metode **Agile Scrum** dan jadwal pada SRS bagian 2.6 (pertemuan 8 sampai 14).

## 1. Tujuan dan Lingkup

Membangun aplikasi web absensi berbasis QR Code dan validasi GPS untuk empat peran (Admin/TU, Guru, Siswa, Orang Tua) sesuai 18 kebutuhan fungsional (FR-01 sampai FR-18) dan 8 kebutuhan non-fungsional (NFR-01 sampai NFR-08) di SRS.

**Keputusan yang sudah diambil**
- Berbasis web untuk semua peran (tanpa aplikasi mobile native), sesuai NFR-08.
- Satu codebase full-stack TypeScript (Next.js) dengan PostgreSQL dan Prisma.
- Pemantauan lokasi memakai kombinasi heartbeat saat halaman terbuka, QR per jam pelajaran, dan pengecekan berkala. Definisi final "keluar area" disepakati dengan sekolah.

**Di luar lingkup:** penilaian akademik, penggajian, dan aplikasi mobile native.

## 2. Ringkasan Jadwal

| Fase | Pertemuan | Fokus | Hasil yang Dapat Didemokan |
|---|---|---|---|
| Persiapan | sebelum 8 | Setup repo, environment, database, schema | Project berjalan di semua laptop |
| Sprint 1 | 8-9 | Akun, login, data master | Admin bisa login dan mengelola data |
| Sprint 2 | 10-11 | Absensi QR Code dan GPS | Siswa bisa absen, guru melihat kehadiran |
| Sprint 3 | 12-13 | Dashboard, rekap, keluar area | Alur lengkap dari sesi sampai laporan |
| Pengujian akhir | 13 | Perbaikan bug dan uji menyeluruh | Daftar bug kritis nol |
| Presentasi | 14 | Demo dan presentasi | Aplikasi ter-deploy dan berjalan |

Setiap sprint berlangsung dua pertemuan dan ditutup dengan **Sprint Review** (demo ke dosen/stakeholder) serta **Sprint Retrospective** (evaluasi cara kerja tim).

## 3. Persiapan (Sprint 0)

| ID | Tugas | PIC | Status |
|---|---|---|---|
| S0-01 | Buat repo GitHub, undang semua anggota, aktifkan proteksi branch `main` | | [ ] |
| S0-02 | Setup Next.js, Prisma 7, Tailwind, shadcn/ui | | [ ] |
| S0-03 | `docker-compose.yml` PostgreSQL, `.env.example`, README | | [ ] |
| S0-04 | Schema Prisma awal dan migrasi pertama (lihat `docs/DATABASE.md`) | | [ ] |
| S0-05 | Seed data pengembangan | | [ ] |
| S0-06 | Konfigurasi ESLint, format commit, dan template Pull Request | | [ ] |
| S0-07 | Pastikan semua anggota bisa menjalankan project dari nol | | [ ] |

## 4. Product Backlog per Sprint

Prioritas: **M** Must, **S** Should, **C** Could. PIC diisi saat Sprint Planning.

### Sprint 1: Akun, Login, dan Data Master (pertemuan 8-9)

**Sprint Goal:** Admin dapat login dan mengelola seluruh data master, dan setiap peran masuk ke halamannya masing-masing.

| ID | Tugas | Kebutuhan | Prioritas | PIC | Status |
|---|---|---|---|---|---|
| S1-01 | Halaman login, hash argon2, sesi JWT di cookie `httpOnly` | FR-01, NFR-02 | M | | [ ] |
| S1-02 | Guard akses per peran (middleware + pengecekan di server) | FR-01, NFR-02 | M | | [ ] |
| S1-03 | Layout dan navigasi per peran (mobile-first Siswa/Guru, sidebar Admin/TU) | NFR-01 | M | | [ ] |
| S1-04 | CRUD siswa, termasuk pembuatan akun dan relasi ke orang tua | FR-02 | M | | [ ] |
| S1-05 | CRUD guru dan akun guru | FR-02 | M | | [ ] |
| S1-06 | CRUD jadwal pelajaran (guru, kelas, hari, jam) | FR-02 | M | | [ ] |
| S1-07 | CRUD lokasi sekolah (koordinat dan radius) | FR-02 | M | | [ ] |
| S1-08 | Validasi input dengan Zod dan pesan gagal yang jelas | FR-17 | M | | [ ] |
| S1-09 | Audit log: login, logout, perubahan data master | FR-18, NFR-07 | S | | [ ] |
| S1-10 | Nonaktifkan akun (bukan hapus) | FR-02 | S | | [ ] |
| S1-11 | Impor siswa dari CSV | | C | | [ ] |

**Definition of Done Sprint 1:** login berfungsi untuk keempat peran, rute terlindungi sesuai peran, CRUD data master berjalan dengan validasi, dan semua kode sudah di-merge ke `main` lewat Pull Request.

### Sprint 2: Absensi QR Code dan GPS (pertemuan 10-11)

**Sprint Goal:** Siswa dapat check-in dan check-out dengan scan QR dan GPS, dan sistem menentukan status Hadir atau Terlambat secara otomatis.

| ID | Tugas | Kebutuhan | Prioritas | PIC | Status |
|---|---|---|---|---|---|
| S2-01 | Guru memilih kelas dan jadwal, sistem mencocokkan dengan jadwal mengajar | FR-03 | M | | [ ] |
| S2-02 | Generate token QR, simpan sesi aktif dengan masa berlaku, tampilkan QR Code | FR-04 | M | | [ ] |
| S2-03 | Halaman scan QR di perangkat siswa (kamera) | FR-05, EI-02 | M | | [ ] |
| S2-04 | Ambil koordinat GPS dan akurasi dari browser, kirim ke server | FR-05 | M | | [ ] |
| S2-05 | Validasi geofencing (Haversine) dan akurasi GPS di server | FR-06, NFR-06 | M | | [ ] |
| S2-06 | Validasi token QR, jadwal, waktu server, dan duplikasi | FR-07, NFR-03 | M | | [ ] |
| S2-07 | Simpan jam masuk, tentukan Hadir/Terlambat (batas 5 menit) | FR-08 | M | | [ ] |
| S2-08 | Check-out dan simpan jam pulang | FR-09 | M | | [ ] |
| S2-09 | Pengajuan izin/sakit oleh siswa dan alur konfirmasi | FR-11 | M | | [ ] |
| S2-10 | Riwayat kehadiran siswa | FR-12 | M | | [ ] |
| S2-11 | Daftar kehadiran pada sesi yang dibuka guru | FR-13 | M | | [ ] |
| S2-12 | Pesan gagal yang sesuai untuk semua kasus penolakan | FR-17 | M | | [ ] |
| S2-13 | Penanganan saat absensi gagal terkirim (coba ulang, pesan jelas) | NFR-04 | S | | [ ] |
| S2-14 | Pengujian di HP nyata lewat HTTPS (kamera dan GPS) | EI-02, EI-03 | M | | [ ] |

**Definition of Done Sprint 2:** alur guru membuka sesi hingga siswa absen berjalan end-to-end di HP nyata, semua kasus penolakan (di luar radius, QR kedaluwarsa, duplikat) teruji, dan unit test untuk fungsi Haversine serta penentuan status tersedia.

### Sprint 3: Dashboard, Rekap, dan Keluar Area (pertemuan 12-13)

**Sprint Goal:** Sekolah dan orang tua dapat memantau kehadiran, dan sistem mendeteksi siswa yang keluar area sesuai aturan yang disepakati.

| ID | Tugas | Kebutuhan | Prioritas | PIC | Status |
|---|---|---|---|---|---|
| S3-01 | Dashboard kehadiran real-time (polling 5-10 detik) untuk Admin/TU dan Guru | FR-15, NFR-05 | M | | [ ] |
| S3-02 | Rekap dan laporan per periode dan kelas | FR-16 | M | | [ ] |
| S3-03 | Ekspor laporan ke Excel | FR-16 | S | | [ ] |
| S3-04 | Halaman orang tua: pilih anak dan periode, lihat riwayat | FR-14 | M | | [ ] |
| S3-05 | Heartbeat lokasi setelah check-in (Wake Lock, kirim berkala) | FR-10 | M | | [ ] |
| S3-06 | Deteksi keluar area dan status `monitoring_status` | FR-10 | M | | [ ] |
| S3-07 | Status "tidak terpantau" saat heartbeat berhenti | FR-10 | S | | [ ] |
| S3-08 | PWA: install ke home screen dan antrean kirim ulang | NFR-04 | S | | [ ] |
| S3-09 | Backup database berkala | NFR-04 | S | | [ ] |
| S3-10 | Grafik ringkasan di dashboard | FR-15 | C | | [ ] |
| S3-11 | Upgrade polling ke Server-Sent Events | NFR-05 | C | | [ ] |

**Definition of Done Sprint 3:** dashboard menampilkan data terbaru tanpa muat ulang manual, laporan sesuai data di database, dan aturan keluar area sudah disepakati serta terimplementasi.

### Pengujian dan Perbaikan Akhir (pertemuan 13)

| ID | Tugas | PIC | Status |
|---|---|---|---|
| T-01 | Uji menyeluruh tiap peran memakai skenario di bagian 6 | | [ ] |
| T-02 | Uji di beberapa HP (Android dan iPhone) dan browser | | [ ] |
| T-03 | Perbaikan bug prioritas tinggi | | [ ] |
| T-04 | Deploy ke hosting dengan HTTPS dan database produksi | | [ ] |
| T-05 | Telusuri ulang matriks kebutuhan (SRS Lampiran) terhadap fitur yang jadi | | [ ] |
| T-06 | Siapkan akun dan data demo untuk presentasi | | [ ] |

### Presentasi (pertemuan 14)

- [ ] Skenario demo disusun dan dilatih
- [ ] Slide presentasi selesai
- [ ] Cadangan jika koneksi bermasalah (rekaman layar demo)

## 5. Aturan Kerja Tim

**Git**
- `main` hanya berisi kode stabil dan tidak boleh di-push langsung.
- Satu fitur satu branch: `feat/login`, `feat/scan-qr`, `fix/geofence-radius`.
- Gabungkan lewat Pull Request dengan minimal satu reviewer.
- Pesan commit: `feat:`, `fix:`, `docs:`, `chore:`, `test:`.
- Perubahan schema dilakukan lewat migrasi Prisma dan diberi tahu ke seluruh tim, karena memengaruhi database lokal semua anggota.

**Ritme Scrum**
- **Sprint Planning:** awal sprint, memilih item backlog dan menetapkan PIC.
- **Check-in singkat:** setiap pertemuan, tiga pertanyaan: apa yang sudah dikerjakan, apa yang akan dikerjakan, apa kendalanya.
- **Sprint Review:** akhir sprint, demo hasil.
- **Retrospective:** akhir sprint, evaluasi cara kerja dan masukan untuk sprint berikutnya.

**Definition of Done umum (berlaku untuk semua item)**
1. Kode sudah di-review dan di-merge ke `main`.
2. Validasi input dilakukan di server.
3. Tidak ada error pada `npm run lint` dan `npm run build`.
4. Fitur sudah dicoba oleh orang selain pembuatnya.
5. Dokumentasi (README atau `docs/`) diperbarui jika ada perubahan yang memengaruhi cara pakai.

## 6. Skenario Pengujian Utama

| No | Skenario | Hasil yang Diharapkan |
|---|---|---|
| 1 | Login dengan akun salah | Ditolak dengan pesan gagal |
| 2 | Siswa membuka halaman Admin | Akses ditolak |
| 3 | Guru membuka sesi di luar jadwal mengajarnya | Sesi ditolak |
| 4 | Siswa scan QR di dalam radius sekolah | Absensi berhasil, status Hadir |
| 5 | Siswa scan QR lebih dari 5 menit setelah sesi dibuka | Status Terlambat |
| 6 | Siswa scan QR di luar radius | Ditolak, pesan lokasi |
| 7 | Siswa scan QR dengan akurasi GPS buruk | Ditolak, minta coba lagi |
| 8 | Siswa scan QR yang sudah kedaluwarsa | Ditolak |
| 9 | Siswa scan dua kali pada sesi yang sama | Ditolak (duplikat) |
| 10 | Waktu perangkat siswa diubah | Tidak berpengaruh, server memakai waktu sendiri |
| 11 | Siswa mengajukan izin/sakit | Status PENDING, lalu berubah setelah dikonfirmasi |
| 12 | Orang tua melihat anak lain | Tidak bisa, hanya anak yang terhubung |
| 13 | Siswa check-in lalu menutup halaman | Status pemantauan menjadi tidak terpantau |
| 14 | Admin mengunduh rekap per kelas | Data sesuai dengan database |

## 7. Risiko dan Mitigasi

Mengacu pada SRS bagian 3.5, ditambah risiko pelaksanaan proyek.

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Akurasi GPS buruk di dalam gedung | Absensi sah ditolak | Radius tidak terlalu ketat, batas akurasi dikonfigurasi, uji langsung di sekolah |
| Pemalsuan lokasi (fake GPS) | Absen dari luar sekolah | QR kedaluwarsa per sesi, validasi akurasi di server, audit log |
| Koneksi internet sekolah tidak stabil | Absensi gagal terkirim | Pesan jelas dan coba ulang, PWA dengan antrean |
| Pemantauan background tidak mungkin di web | FR-10 tidak sepenuhnya real-time | Heartbeat, QR per jam pelajaran, status "tidak terpantau"; aturan disepakati dengan sekolah |
| Kamera/GPS diblokir tanpa HTTPS | Fitur inti tidak jalan | Wajib HTTPS saat uji dan deploy, tunnel HTTPS untuk development |
| Perubahan schema bentrok antar anggota | Migrasi gagal, waktu terbuang | Satu orang memegang schema di awal, perubahan lewat PR dan diumumkan |
| Jadwal sempit (enam pertemuan) | Fitur tidak selesai | Prioritas Must lebih dulu, item Could dibuang tanpa ragu |
| Data siswa di bawah umur | Isu privasi | Batasi pelacakan ke jam sekolah, simpan data seminimal mungkin, retensi data lokasi |

## 8. Pemetaan Kebutuhan ke Sprint

| Sprint | Kebutuhan yang Dicakup |
|---|---|
| Sprint 1 | FR-01, FR-02, FR-17, FR-18, NFR-01, NFR-02, NFR-07, NFR-08 |
| Sprint 2 | FR-03 sampai FR-09, FR-11, FR-12, FR-13, FR-17, NFR-03, NFR-04, NFR-06, EI-02 sampai EI-04 |
| Sprint 3 | FR-10, FR-14, FR-15, FR-16, NFR-04, NFR-05 |

Seluruh 8 permintaan stakeholder pada Lampiran SRS tercakup oleh pemetaan ini.

## 9. Lingkungan Deployment

| Lingkungan | Tujuan | Catatan |
|---|---|---|
| Lokal | Pengembangan | `npm run dev` + PostgreSQL via Docker Compose |
| Demo/Produksi | Uji di HP dan presentasi | Wajib HTTPS. Opsi mudah: Vercel + database terkelola (Neon/Supabase). Opsi mandiri: VPS dengan Docker dan reverse proxy |

Variabel environment di produksi diisi lewat pengaturan hosting, dengan `AUTH_SECRET` baru yang berbeda dari milik development.

## 10. Hal yang Perlu Diputuskan di Awal

- [ ] Pembagian PIC untuk enam anggota (diisi pada Sprint Planning).
- [ ] Pilihan hosting untuk demo.
- [ ] Siapa yang mengonfirmasi izin/sakit (lihat `docs/DATABASE.md` bagian 10).
- [ ] Aturan "keluar area" bersama pihak sekolah.
- [ ] Revisi SRS untuk tambahan struktur database.