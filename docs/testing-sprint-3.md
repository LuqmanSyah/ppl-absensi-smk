# Panduan Pengujian Sprint 3

Pengujian hasil Sprint 3: dashboard real-time, rekap dan ekspor Excel, halaman orang tua, absen selesai pelajaran, PWA, dan backup.

**Hasil pengujian otomatis (4 November 2026):**
- `npm test`: 36 unit test lulus, termasuk jendela absen selesai (2/3 pelajaran, waktu tambahan 10 menit).
- `npm run test:e2e`: 89 tes E2E lulus (dua kali berturut-turut). Waktu pelajaran disimulasikan dengan menggeser jam jadwal di database, dan posisi GPS dipalsukan di browser. Uji di HP sungguhan ada di bagian 3.

## 1. Aturan Absen Selesai (pengganti pemantauan lokasi berkala, FR-10)

Rencana awal memakai heartbeat (HP mengirim lokasi tiap menit). Rencana ini diganti karena aplikasi web tidak bisa membaca lokasi di latar belakang. Akibatnya siswa yang sekadar mengunci layar akan dianggap "tidak terpantau", selain juga boros baterai. Sebagai gantinya:

| Aturan | Nilai | Bisa diubah lewat |
|---|---|---|
| Absen masuk | Sejak sesi dibuka sampai jam pelajaran berakhir | |
| Absen selesai dibuka | Setelah 2/3 durasi pelajaran, dihitung dari **jam mulai jadwal**. Contoh: 07:00-07:30 mulai 07:20; 07:00-08:30 mulai 08:00 | `CHECKOUT_AFTER_PERCENT` |
| Absen selesai ditutup | 10 menit setelah jam pelajaran berakhir | `CHECKOUT_GRACE_MINUTES` |
| Cara | Scan QR yang sama, lokasi divalidasi seperti absen masuk (radius dan akurasi), lalu konfirmasi | |
| Tidak absen selesai | Tetap dihitung Hadir/Terlambat, diberi tanda **Tidak absen selesai** di daftar hadir, dashboard, laporan, Excel, dan halaman orang tua | |

Kelebihan: siswa yang meninggalkan sekolah di tengah pelajaran harus kembali untuk absen selesai, atau ketahuan karena tidak absen selesai. Keterbatasan: kepergian singkat di antara absen masuk dan absen selesai tidak terdeteksi. Ini perlu dijelaskan saat presentasi dan dikonfirmasi ke dosen, karena mengubah cara memenuhi FR-10 di SRS.

## 2. Skenario Uji

Nomor uji sama dengan nama tes di folder `e2e/`.

### 2.1 Absen selesai

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| C-01 | Siswa absen masuk | Pesan berhasil berisi "Jangan lupa absen selesai mulai pukul HH:MM"; beranda siswa menampilkan jam yang sama | [x] |
| C-02 | Scan lagi sebelum jam tersebut | "Belum waktunya absen selesai ... mulai pukul HH:MM" | [x] |
| C-03 | Scan setelah jam tersebut dari luar sekolah | Ditolak "di luar area sekolah"; setelah kembali ke sekolah dan **Coba lagi**, muncul konfirmasi, lalu **Ya, absen selesai** berhasil | [x] |
| C-04 | Siswa yang belum absen masuk scan setelah jam pelajaran berakhir | Ditolak "absen masuk ditutup" | [x] |
| C-05 | Siswa yang sudah absen masuk scan dalam 10 menit setelah pelajaran berakhir | Absen selesai berhasil | [x] |
| C-06 | Scan lebih dari 10 menit setelah pelajaran berakhir | Ditolak "Waktu absen selesai sudah lewat" | [x] |
| C-07 | Guru membuka daftar hadir setelah sesi berakhir | Ringkasan "Absen selesai: x/y", peringatan jumlah siswa yang tidak absen selesai, dan badge **Tidak absen selesai** di baris siswa tersebut (skenario uji no. 13) | [x] |
| C-08 | Laporan kelas | Kolom **Tidak selesai** terisi, persentase kehadiran tidak berkurang | [x] |

### 2.2 Dashboard real-time (S3-01)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| D-01 | Admin membuka dashboard | Ringkasan hari ini (sesi aktif, hadir, terlambat, sudah/tidak absen selesai), tabel sesi hari ini dengan progres kehadiran dan absen selesai, serta data master | [x] |
| D-02 | Biarkan dashboard terbuka, siswa absen dari HP | Angka berubah sendiri dalam 10 detik tanpa refresh | [x] |
| D-03 | Klik nama sesi di tabel | Daftar hadir sesi tersebut (tanpa QR), ikut diperbarui otomatis | [x] |
| D-04 | Guru membuka beranda saat ada sesi aktif | Kartu jadwal menampilkan "x/y hadir" dan "x/y absen selesai", diperbarui otomatis | [ ] |

### 2.3 Rekap, laporan, dan Excel (S3-02, S3-03)

Definisi: setiap **sesi absensi** (satu pelajaran yang dibuka guru) dihitung satu kali per siswa.
- **Hadir/Terlambat** = ada catatan absen masuk.
- **Izin/Sakit** = tidak absen, tetapi ada pengajuan yang **disetujui** pada tanggal itu.
- **Alpa** = tidak absen dan tidak ada izin yang disetujui (izin yang masih menunggu tetap dihitung alpa).
- **Tidak selesai** = hadir tetapi tidak absen selesai (keterangan saja).
- **Kehadiran %** = (Hadir + Terlambat) / jumlah sesi.

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| R-01 | Admin → **Laporan**, pilih kelas dan periode | Tabel per siswa dengan jumlah Hadir, Terlambat, Izin, Sakit, Alpa, Tidak selesai, persentase, dan baris Total; angka sesuai daftar hadir tiap sesi (skenario uji no. 14) | [x] |
| R-02 | Ubah filter periode menjadi satu hari | Jumlah sesi dan angka menyesuaikan | [x] |
| R-03 | Klik **Unduh Excel**, buka di Excel/LibreOffice | File `rekap-<kelas>-<dari>-sd-<sampai>.xlsx` berisi angka yang sama dengan layar | [x] |
| R-04 | Klik nama siswa | Riwayat per pelajaran siswa tersebut | [x] |
| R-05 | Guru/siswa membuka `/admin/laporan` atau tautan Excel | Ditolak | [x] |

### 2.4 Orang tua (S3-04, FR-14)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| P-01 | Login `ortu1` (punya 2 anak di data seed) | Tombol pilihan anak, ringkasan kehadiran, catatan "x kali hadir tetapi tidak absen selesai", riwayat per pelajaran, dan pengajuan izin anak | [x] |
| P-02 | Ganti anak dan periode | Data berubah sesuai anak dan periode yang dipilih | [x] |
| P-03 | Ubah `anak=` di alamat menjadi ID siswa lain | Halaman "Halaman tidak ditemukan", data anak lain tidak tampil (skenario uji no. 12) | [x] |
| P-04 | Orang tua yang belum terhubung ke siswa | Pesan untuk menghubungi Admin TU | [x] |

### 2.5 PWA dan kirim ulang (S3-08)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| W-01 | Buka `/manifest.webmanifest` | Berisi nama aplikasi dan ikon | [x] |
| W-02 | Di Chrome Android lewat HTTPS: menu ⋮ → Instal aplikasi | Ikon "Absensi SMK" muncul di layar utama, terbuka tanpa bilah alamat | [ ] |
| W-03 | Matikan internet saat absen, lalu nyalakan lagi tanpa menekan apa pun | Absensi terkirim otomatis begitu koneksi kembali (halaman tetap terbuka) | [ ] |

Catatan desain: absensi yang gagal hanya dikirim ulang **selama halaman masih terbuka**. Absensi tidak disimpan untuk dikirim berjam-jam kemudian, karena jam absen harus dari waktu server saat diterima (NFR-03) dan sesinya bisa sudah berakhir.

### 2.6 Backup (S3-09)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| B-01 | `npm run db:backup` | File `backups/absensi-<tanggal>.dump` terbentuk | [x] |
| B-02 | `pg_restore --list` pada file backup | Semua tabel terdaftar (sudah dicek: 13 tabel) | [x] |
| B-03 | Pulihkan backup ke database kosong | Data kembali utuh | [ ] |

## 3. Uji di HP Nyata (wajib manual)

Gunakan cara yang sama dengan `docs/testing-sprint-2.md` bagian 5 (Cloudflare Tunnel). Admin membuat jadwal pendek untuk hari ini (misalnya 30 menit) agar absen selesai cepat terbuka (menit ke-20).

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| H-01 | Absen masuk, kunci layar HP, buka lagi setelah menit ke-20, lalu scan QR | Absen selesai berhasil tanpa perlu membiarkan halaman terbuka | [ ] |
| H-02 | Absen masuk, pergi ke luar radius, coba absen selesai | Ditolak di luar area; berhasil setelah kembali ke sekolah | [ ] |
| H-03 | Absen masuk lalu tidak absen selesai | Setelah sesi berakhir, guru dan laporan menampilkan "Tidak absen selesai" | [ ] |
| H-04 | Pasang aplikasi ke layar utama (W-02) lalu absen dari sana | Kamera dan GPS tetap berfungsi | [ ] |

## 4. Tidak Dikerjakan (prioritas Could)

- **S3-10 Grafik ringkasan:** dashboard sudah memiliki angka ringkasan dan bilah progres kehadiran per sesi. Grafik tren bisa ditambahkan jika waktu tersedia.
- **S3-11 Server-Sent Events:** polling 10 detik sudah memenuhi NFR-05 dan lebih sederhana dioperasikan di hosting serverless.
