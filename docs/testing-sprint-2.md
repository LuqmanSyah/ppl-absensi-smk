# Panduan Pengujian Sprint 2

Pengujian hasil Sprint 2: absensi QR Code dan GPS, status Hadir/Terlambat, check-out, izin/sakit, dan riwayat.

**Hasil pengujian otomatis (4 November 2026):**
- `npm test`: 27 unit test lulus (Haversine, validasi lokasi, batas 5 menit, jendela membuka sesi, zona waktu).
- `npm run test:e2e`: 75 tes E2E lulus. Tes absensi memalsukan posisi GPS di browser dan membuka QR lewat link, jadi **kamera dan GPS asli belum teruji**. Bagian 5 (uji di HP nyata, S2-14) wajib dilakukan manual.

## 1. Aturan yang Berlaku

| Aturan | Nilai | Bisa diubah lewat |
|---|---|---|
| Guru boleh membuka sesi | 15 menit sebelum jam mulai sampai jam selesai, hanya untuk jadwalnya sendiri di hari itu | `OPEN_SESSION_EARLY_MINUTES` |
| QR berlaku | Sampai jam selesai jadwal, atau sampai guru menutup sesi | |
| Terlambat | Check-in lebih dari 5 menit setelah sesi **dibuka** | `LATE_AFTER_MINUTES` |
| Akurasi GPS | Maksimal 50 m | `MAX_GPS_ACCURACY_M` |
| Radius | Sesuai lokasi sekolah aktif (menu Admin → Lokasi Sekolah) | |
| Check-out | Scan QR yang sama selama sesi masih aktif, dengan konfirmasi | |
| Izin/sakit | Dikonfirmasi Admin TU; maksimal 14 hari per pengajuan, paling lambat 7 hari setelah tanggalnya | |
| Waktu | Semua jam dicatat dari waktu server, bukan jam HP | |

## 2. Persiapan

Ikuti README sampai aplikasi berjalan. Akun seed: `guru1` (mengajar XI RPL 1), siswa `2024001`, `2024003`, `2024004` (XI RPL 1), password `password123`.

Agar ada jadwal yang sedang berlangsung saat menguji, login sebagai `admin` → **Jadwal** → tambah jadwal untuk `guru1`, kelas `XI RPL 1`, hari ini, jam mulai beberapa menit yang lalu dan jam selesai satu jam lagi.

Untuk uji di laptop, posisi GPS bisa dipalsukan lewat Chrome DevTools → menu ⋮ → More tools → **Sensors** → Location: isi latitude/longitude lokasi sekolah aktif.

## 3. Guru (S2-01, S2-02, S2-11)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| G-01 | Login `guru1`, di **Jadwal hari ini** klik **Buka sesi absensi** | Halaman sesi terbuka berisi QR Code besar dan daftar seluruh siswa kelas dengan status "Belum absen" | [x] |
| G-02 | Lihat jadwal yang sudah lewat jamnya hari ini | Tidak ada tombol buka sesi, tertulis "Jam pelajaran sudah selesai." (skenario uji no. 3) | [x] |
| G-03 | Biarkan halaman sesi terbuka, siswa absen dari perangkat lain | Daftar dan ringkasan berubah sendiri dalam 10 detik tanpa refresh | [x] |
| G-04 | Klik **Tutup sesi** → **Ya, lanjutkan** | QR hilang, status Berakhir, siswa yang belum absen menjadi "Tidak hadir" | [x] |
| G-05 | Kembali ke beranda, klik **Buka sesi lagi** | Sesi yang sama aktif kembali dengan QR yang sama | [x] |
| G-06 | Menu **Riwayat Sesi** | Sesi yang pernah dibuka tampil dengan jumlah siswa yang absen | [ ] |

## 4. Siswa (S2-03 sampai S2-10, S2-12, S2-13)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| S-01 | Siswa di dalam radius scan QR | "Absen masuk berhasil", status Hadir (skenario no. 4) | [x] |
| S-02 | Scan QR yang sama lagi | Sebelum 2/3 pelajaran: "Belum waktunya absen selesai". Sesudahnya: konfirmasi, lalu **Ya, absen selesai** mencatat jam selesai; scan berikutnya ditolak "sudah absen selesai" (skenario no. 9). *Diperbarui di Sprint 3.* | [x] |
| S-03 | Scan dari luar radius | Ditolak dengan jarak ke sekolah, tombol Coba lagi (skenario no. 6) | [x] |
| S-04 | Scan dengan akurasi GPS buruk (> 50 m) | Ditolak "Sinyal GPS kurang akurat", berhasil setelah akurasi membaik dan Coba lagi (skenario no. 7) | [x] |
| S-05 | Scan lebih dari 5 menit setelah sesi dibuka | Status Terlambat (skenario no. 5) | [x] |
| S-06 | Ubah jam HP, lalu absen | Jam yang tercatat tetap jam server (skenario no. 10) | [x] |
| S-07 | Matikan internet tepat sebelum absen terkirim | "Absensi gagal terkirim ... belum tercatat"; nyalakan internet, Coba lagi berhasil | [x] |
| S-08 | Siswa kelas lain scan QR | Ditolak "QR Code ini untuk kelas ..." | [x] |
| S-09 | Scan QR selain QR absensi atau QR palsu | Ditolak, tombol Scan ulang | [x] |
| S-10 | Tolak izin lokasi di browser | Pesan cara mengizinkan lokasi | [x] |
| S-11 | Scan setelah sesi ditutup guru | Ditolak "sudah ditutup atau kedaluwarsa" (skenario no. 8) | [x] |
| S-12 | Menu **Riwayat**, pilih bulan | Daftar kehadiran dan ringkasan jumlah hadir/terlambat sesuai | [x] |
| S-13 | Beranda siswa | Pelajaran hari ini dengan status kehadiran masing-masing | [x] |

## 5. Uji di HP Nyata lewat HTTPS (S2-14, wajib manual)

Kamera dan GPS hanya bisa dipakai browser lewat **HTTPS** (atau `localhost`). Alamat IP laptop seperti `http://192.168.x.x:3000` **tidak akan bisa** membuka kamera di HP.

**Langkah dengan Cloudflare Tunnel (gratis, tanpa akun):**

1. Pasang `cloudflared` ([panduan instalasi](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)).
2. Jalankan aplikasi. Disarankan versi production agar perilakunya sama dengan saat deploy:
   ```bash
   npm run build && npm run start
   ```
3. Di terminal lain:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
   Catat alamat `https://xxxx.trycloudflare.com` yang muncul.
4. Login sebagai admin dari laptop lewat alamat tunnel tersebut, lalu atur **Lokasi Sekolah** ke titik tempat pengujian dilakukan (misalnya rumah atau kampus) dengan radius 100 m.
5. Guru membuka sesi di laptop lewat alamat tunnel. QR akan berisi alamat tunnel.
6. Di HP, buka alamat tunnel, login sebagai siswa, lalu menu **Absen**.

**Hasil uji di HP nyata (4 November 2026):** lewat Cloudflare Tunnel, absen dari titik lokasi uji berhasil (status Hadir dan Terlambat), dan absen dari lokasi lain sekitar beberapa kilometer ditolak karena di luar radius.

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| H-01 | Android (Chrome): menu Absen | Browser meminta izin kamera; kamera belakang terbuka | [x] |
| H-02 | Arahkan ke QR di layar laptop | QR terbaca, browser meminta izin lokasi, lalu absen berhasil | [x] |
| H-03 | Pindai QR memakai aplikasi kamera bawaan HP (bukan dari menu Absen) | Link terbuka di browser, langsung mencari lokasi dan mengirim absensi | [ ] |
| H-04 | iPhone (Safari): ulangi H-01 sampai H-03 | Sama | [ ] |
| H-05 | Uji di dalam gedung/kelas | Catat akurasi yang muncul jika ditolak. Jika sering di atas 50 m, diskusikan menaikkan `MAX_GPS_ACCURACY_M` | [ ] |
| H-06 | Matikan data/Wi-Fi saat menekan absen | Pesan "gagal terkirim", berhasil setelah koneksi kembali dan Coba lagi | [x] |
| H-07 | Tolak izin lokasi, lalu izinkan dari pengaturan browser | Setelah diizinkan, Coba lagi berhasil | [x] |

**Jika muncul masalah:**
- *Halaman terbuka tapi tombol tidak bereaksi saat memakai `npm run dev`:* pastikan domain tunnel ada di `allowedDevOrigins` pada `next.config.ts` (`*.trycloudflare.com` dan ngrok sudah ditambahkan), atau pakai `npm run start`.
- *Absensi gagal dengan error "Invalid Server Actions request":* tunnel tidak meneruskan host aslinya. Isi `APP_URL` dengan alamat tunnel, dan laporkan ke tim untuk menambahkan host tunnel ke `experimental.serverActions.allowedOrigins`.
- *QR berisi alamat `localhost`:* isi `APP_URL` di `.env` dengan alamat tunnel, lalu jalankan ulang aplikasi.

## 6. Izin dan Sakit (S2-09)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| I-01 | Siswa menu **Izin**, kirim alasan kurang dari 10 karakter atau tanggal terbalik | Ditolak dengan pesan per field, isian tidak hilang | [x] |
| I-02 | Kirim pengajuan Sakit untuk hari ini | "Pengajuan terkirim", form kosong kembali, status Menunggu (skenario no. 11) | [x] |
| I-03 | Kirim pengajuan lain di tanggal yang sama | Ditolak "Sudah ada pengajuan lain" | [x] |
| I-04 | Guru membuka daftar hadir sesi hari itu | Siswa tersebut berstatus "Izin menunggu" | [x] |
| I-05 | Admin: dashboard menampilkan "Izin menunggu", menu **Izin & Sakit** → **Setujui** | Pengajuan pindah ke tab Disetujui | [x] |
| I-06 | Siswa dan guru melihat kembali | Siswa: Disetujui. Guru: siswa berstatus Sakit, ringkasan Izin/Sakit bertambah | [x] |
| I-07 | Siswa membatalkan pengajuan yang masih menunggu | Pengajuan hilang | [x] |
| I-08 | Admin menolak pengajuan | Siswa melihat status Ditolak | [x] |

## 7. Audit Log

Di `npx prisma studio` → `audit_logs`, setelah pengujian harus ada: `SESSION_OPEN`, `SESSION_CLOSE`, `SESSION_REOPEN`, `SESSION_OPEN_REJECTED`, `ATTENDANCE_CHECK_IN`, `ATTENDANCE_CHECK_OUT`, `ATTENDANCE_REJECTED` (berisi kode alasan, jarak, dan akurasi, tetapi **tanpa koordinat siswa**), `LEAVE_CREATE`, `LEAVE_CANCEL`, `LEAVE_APPROVE`, `LEAVE_REJECT`.
