# Panduan Pengujian Sprint 1

Panduan ini dipakai untuk menguji hasil Sprint 1 (akun, login, hak akses, dan data master) secara manual. Pengujian sebaiknya dilakukan oleh anggota **selain pembuat fitur** (Definition of Done poin 4).

> **Versi otomatis:** hampir semua skenario di dokumen ini juga tersedia sebagai tes E2E di folder `e2e/` (nomor uji yang sama tercantum di nama tes). Jalankan `npm run test:e2e`, lihat README bagian "Pengujian". Uji manual tetap berguna untuk menilai tampilan dan kenyamanan pemakaian yang tidak bisa dinilai otomatis.

**Hasil pengujian:** semua skenario lulus lewat tes E2E otomatis (`npm run test:e2e`, 51 tes) pada 4 November 2026. Kolom **Lulus** di bawah sudah dicentang berdasarkan hasil tersebut. Uji manual oleh anggota tim tetap disarankan saat tim kembali, terutama untuk menilai tampilan di HP sungguhan.

Status cakupan saat ini:

| Item | Fitur | Bisa diuji |
|---|---|---|
| S1-01 | Login, hash argon2, sesi JWT | Ya |
| S1-02 | Guard akses per peran | Ya |
| S1-03 | Layout dan navigasi per peran | Ya |
| S1-04 | CRUD siswa dan relasi ke orang tua (termasuk CRUD orang tua) | Ya |
| S1-05 | CRUD guru | Ya |
| S1-06 | CRUD jadwal pelajaran | Ya |
| S1-07 | CRUD lokasi sekolah | Ya |
| S1-08 | Validasi Zod dan pesan gagal | Ya (diuji di setiap form) |
| S1-09 | Audit log login, logout, dan perubahan data master | Ya |
| S1-10 | Nonaktifkan akun | Ya |
| S1-11 | Impor siswa dari CSV | Ya |

## 1. Persiapan

Ikuti langkah "Cara Menjalankan" di `README.md` sampai aplikasi berjalan. Ringkasnya:

```bash
git checkout <branch-yang-diuji>
git pull
npm install
docker compose up -d          # atau: podman compose up -d
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Pastikan `AUTH_SECRET` di `.env` sudah diisi (minimal 32 karakter). Jika kosong, login akan error.

**Akun uji** (password semua akun: `password123`):

| Peran | Username | Halaman awal |
|---|---|---|
| Admin/TU | `admin` | `/admin` |
| Guru | `guru1`, `guru2` | `/guru` |
| Orang Tua | `ortu1`, `ortu2` | `/orang-tua` |
| Siswa | `2024001` sampai `2024006` | `/siswa` |

**Tips:** gunakan jendela penyamaran (incognito) atau browser berbeda untuk menguji dua peran sekaligus, karena satu browser hanya menyimpan satu sesi.

## 2. Login (S1-01)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| L-01 | Buka `/login`, kosongkan username dan password, klik **Masuk** | Muncul pesan "Username wajib diisi." dan "Password wajib diisi." | [x] |
| L-02 | Login dengan `admin` / `salah` | Muncul pesan "Username atau password salah.", username tetap terisi | [x] |
| L-03 | Login dengan `tidakada` / `password123` | Pesan sama persis dengan L-02 (tidak membocorkan username mana yang terdaftar) | [x] |
| L-04 | Login dengan `admin` / `password123` | Masuk ke `/admin`, tampil "Halo, Admin TU" | [x] |
| L-05 | Login sebagai `guru1` | Masuk ke `/guru`, tampil nama "Budi Santoso" | [x] |
| L-06 | Login sebagai `2024001` | Masuk ke `/siswa`, tampil nama "Rizky Wijaya" | [x] |
| L-07 | Login sebagai `ortu1` | Masuk ke `/orang-tua`, tampil nama "Ahmad Wijaya" | [x] |
| L-08 | Setelah login, klik tombol **Keluar** | Kembali ke `/login`; membuka `/admin` lagi diarahkan ke `/login` | [x] |
| L-09 | Setelah login, buka DevTools → Application → Cookies | Ada cookie `session` dengan centang **HttpOnly** | [x] |
| L-10 | Hapus cookie `session` lalu refresh halaman | Diarahkan ke `/login` | [x] |

## 3. Hak Akses per Peran (S1-02)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| A-01 | Tanpa login, buka `/admin`, `/guru`, `/siswa`, `/orang-tua` | Semua diarahkan ke `/login` | [x] |
| A-02 | Tanpa login, buka `/` | Diarahkan ke `/login` | [x] |
| A-03 | Login sebagai siswa, buka `/admin` dan `/admin/siswa` | Ditolak, diarahkan kembali ke `/siswa` (skenario uji no. 2 di `planning.md`) | [x] |
| A-04 | Login sebagai guru, buka `/siswa` dan `/orang-tua` | Ditolak, diarahkan ke `/guru` | [x] |
| A-05 | Login sebagai admin, buka `/guru` | Ditolak, diarahkan ke `/admin` | [x] |
| A-06 | Setelah login, buka `/` | Diarahkan ke halaman awal peran masing-masing | [x] |
| A-07 | Login sebagai `2024004`. Di terminal lain jalankan `npx prisma studio`, ubah `is_active` user `2024004` menjadi `false`, lalu refresh halaman siswa | Diarahkan ke `/login` walaupun cookie masih ada | [x] |
| A-08 | Lanjutan A-07: coba login lagi sebagai `2024004` | Ditolak dengan pesan "Akun Anda dinonaktifkan. Hubungi Admin TU." | [x] |
| A-09 | Kembalikan `is_active` user `2024004` menjadi `true` | Bisa login lagi | [x] |

## 4. Layout dan Navigasi (S1-03)

Uji di layar desktop dan mode HP (DevTools → Toggle device toolbar, misalnya iPhone SE / 375 px).

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| N-01 | Login admin di layar desktop | Sidebar kiri berisi Dashboard, Siswa, Guru, Jadwal, Lokasi Sekolah | [x] |
| N-02 | Klik tiap menu di sidebar | Halaman berpindah dan menu yang aktif tersorot | [x] |
| N-03 | Login admin di mode HP | Sidebar hilang, menu tampil sebagai baris geser horizontal di bawah header | [x] |
| N-04 | Dashboard admin | Kartu jumlah siswa aktif (6), guru aktif (2), jadwal (3), lokasi aktif (1) sesuai data seed | [x] |
| N-05 | Login guru/siswa/orang tua di mode HP | Header berisi nama dan tombol Keluar, konten tidak terpotong dan tidak perlu geser ke samping | [x] |
| N-06 | Klik kartu di dashboard admin | Membuka halaman data yang sesuai | [x] |

## 5. Audit Log (S1-09, sebagian)

Buka `npx prisma studio`, lalu tabel `audit_logs`. Urutkan berdasarkan `id` terbaru.

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| G-01 | Login berhasil | Ada baris `LOGIN` dengan `user_id` akun tersebut dan `ip_address` terisi | [x] |
| G-02 | Login dengan password salah untuk `admin` | Ada baris `LOGIN_FAILED` dengan `user_id` admin | [x] |
| G-03 | Login dengan username yang tidak ada | Ada baris `LOGIN_FAILED` dengan `user_id` kosong dan `detail` berisi username | [x] |
| G-04 | Klik **Keluar** | Ada baris `LOGOUT` | [x] |
| G-05 | Periksa kolom `detail` semua baris | Tidak ada password, hash, atau token yang tersimpan | [x] |

## 6. Data Master (S1-04 sampai S1-11)

Semua uji di bagian ini dilakukan sebagai `admin`. Setiap form juga harus memenuhi aturan umum berikut:
- Saat gagal, pesan muncul di atas form dan di bawah field yang salah, dan isian yang sudah diketik **tidak hilang**.
- Saat berhasil, kembali ke halaman daftar dan data baru langsung tampil.

### 6.1 Siswa (S1-04)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| D-01 | Menu **Siswa** → **Tambah siswa**, isi NIS `abc`, nama `A`, password `123`, simpan | Ditolak: "NIS hanya berisi angka", "Nama minimal 3 karakter", "Password minimal 8 karakter" | [x] |
| D-02 | Tambah siswa dengan NIS `2024001` | Ditolak: "NIS sudah terdaftar." | [x] |
| D-03 | Tambah siswa NIS `2024099`, nama `Siswa Uji`, kelas `xi  rpl 1` (huruf kecil, spasi ganda), orang tua `Ahmad Wijaya`, password `rahasia123` | Berhasil; di daftar kelas tampil `XI RPL 1` dan orang tua `Ahmad Wijaya` | [x] |
| D-04 | Logout, login sebagai `2024099` / `rahasia123` | Berhasil masuk ke `/siswa` | [x] |
| D-05 | Ubah siswa `2024099`: NIS menjadi `2024098`, orang tua "Belum dihubungkan", password dikosongkan | Berhasil; login sekarang memakai `2024098` dengan password lama | [x] |
| D-06 | Ubah siswa `2024098`, isi password baru `passwordbaru1` | Login dengan password lama gagal, dengan password baru berhasil | [x] |
| D-07 | Ubah NIS siswa `2024098` menjadi `2024001` | Ditolak: "NIS sudah terdaftar." | [x] |
| D-08 | Pencarian: ketik `rizky`, lalu filter kelas `XI RPL 2` | Daftar tersaring sesuai pencarian/filter | [x] |

### 6.2 Orang Tua (bagian dari S1-04)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| O-01 | Menu **Orang Tua** → tambah `Ortu Uji`, username `ortu.uji`, password `password123` | Berhasil, tampil "Belum terhubung" di kolom Anak | [x] |
| O-02 | Tambah orang tua dengan username `ortu1` | Ditolak: "Username sudah dipakai." | [x] |
| O-03 | Ubah siswa mana pun, pilih orang tua `Ortu Uji` | Di daftar orang tua, nama anak tampil pada `Ortu Uji` | [x] |

### 6.3 Guru (S1-05)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| U-01 | Tambah guru dengan NIP `123` | Ditolak: "NIP hanya berisi angka, 8-30 digit." | [x] |
| U-02 | Tambah guru dengan NIP `198501012010011001` (milik guru1) | Ditolak: "NIP sudah terdaftar." | [x] |
| U-03 | Tambah guru dengan username `guru1` | Ditolak: "Username sudah dipakai." | [x] |
| U-04 | Tambah guru NIP `200001012020121001`, username `Guru.Uji` | Berhasil; username tersimpan sebagai `guru.uji` (huruf kecil) dan bisa login ke `/guru` | [x] |
| U-05 | Di halaman ubah guru, klik **Lihat jadwal** | Membuka daftar jadwal yang sudah terfilter untuk guru tersebut | [x] |

### 6.4 Jadwal Pelajaran (S1-06)

Data seed: `guru1` (Budi Santoso) mengajar XI RPL 1 hari Senin 07:00-08:30.

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| J-01 | Tambah jadwal dengan jam mulai `09:00`, jam selesai `08:00` | Ditolak: "Jam selesai harus setelah jam mulai." | [x] |
| J-02 | Tambah jadwal guru1, kelas XI RPL 2, Senin 08:00-09:00 | Ditolak: "Bentrok dengan jadwal Budi Santoso ..." | [x] |
| J-03 | Tambah jadwal guru2, kelas XI RPL 1, Senin 08:00-09:00 | Ditolak: "Kelas XI RPL 1 sudah ada pelajaran ..." | [x] |
| J-04 | Tambah jadwal guru1, kelas XI RPL 2, Senin 08:30-10:00 | Berhasil (bersambung tepat setelah jadwal lain tidak dianggap bentrok) | [x] |
| J-05 | Ubah jadwal J-04, ganti mata pelajaran saja | Berhasil (tidak bentrok dengan dirinya sendiri) | [x] |
| J-06 | Hapus jadwal J-04 | Muncul konfirmasi, lalu jadwal hilang dari daftar | [x] |
| J-07 | Nonaktifkan akun guru2, lalu buka form tambah jadwal | guru2 tidak ada di pilihan guru | [x] |

### 6.5 Lokasi Sekolah (S1-07)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| K-01 | Tambah lokasi dengan latitude `100`, longitude `abc`, radius `5` | Ditolak dengan pesan di ketiga field | [x] |
| K-02 | Tambah lokasi `Gedung Baru`, latitude `-6,2` (pakai koma), longitude `106.8`, radius `150`, centang aktif | Berhasil; lokasi lama otomatis menjadi "Tidak dipakai" | [x] |
| K-03 | Klik koordinat di daftar | Google Maps terbuka di tab baru pada titik tersebut | [x] |
| K-04 | Buka halaman ubah lokasi yang aktif | Tidak ada tombol hapus | [x] |
| K-05 | Buka lokasi yang tidak aktif, klik **Hapus lokasi** | Muncul konfirmasi, lalu lokasi terhapus | [x] |
| K-06 | Ubah lokasi aktif, hilangkan centang aktif | Muncul peringatan merah "Belum ada lokasi aktif" di halaman daftar | [x] |

### 6.6 Nonaktifkan Akun (S1-10)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| X-01 | Buka ubah siswa, klik **Nonaktifkan akun** | Muncul konfirmasi "Nonaktifkan akun ini?" dengan tombol Batal | [x] |
| X-02 | Klik **Ya, lanjutkan** | Status menjadi Nonaktif, siswa tidak bisa login, data siswa tetap ada di daftar | [x] |
| X-03 | Klik **Aktifkan kembali** | Status Aktif, siswa bisa login lagi | [x] |
| X-04 | Ulangi untuk guru dan orang tua | Perilaku sama | [x] |
| X-05 | Dashboard admin setelah menonaktifkan satu siswa | Angka "Siswa aktif" berkurang satu | [x] |

### 6.7 Impor Siswa dari CSV (S1-11)

Buat file teks berikut dan simpan sebagai `.csv`.

`salah.csv` (pemisah titik koma, seperti hasil Excel bahasa Indonesia):
```
nis;nama;kelas
2024201;Andi Saputra;X RPL 1
xx;B;X RPL 1
2024201;Dobel;X RPL 1
2024001;Siswa Lama;X RPL 1
```

`benar.csv`:
```
nis,nama,kelas
2024201,"Saputra, Andi",X RPL 1
2024202,Bunga Citra,X RPL 1
```

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| I-01 | Menu Siswa → **Impor CSV**, unggah `salah.csv`, password `password123` | Ditolak dengan daftar kesalahan per baris (baris 3, 4, 5); jumlah siswa tidak bertambah sama sekali | [x] |
| I-02 | Unggah `benar.csv` | Berhasil; dua siswa baru tampil, nama `Saputra, Andi` utuh dengan koma | [x] |
| I-03 | Login sebagai `2024202` / `password123` | Berhasil | [x] |
| I-04 | Unggah file yang baris pertamanya bukan `nis,nama,kelas` | Ditolak: "Baris pertama harus berisi judul kolom: nis, nama, kelas." | [x] |

### 6.8 Validasi di Server dan Hak Akses (S1-08)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| V-01 | Di form tambah siswa, buka DevTools → Elements, hapus atribut `required`/`inputMode`, kirim form kosong | Tetap ditolak oleh server dengan pesan yang sama | [x] |
| V-02 | Login sebagai siswa atau guru, buka `/admin/siswa/baru` | Diarahkan kembali ke halaman perannya sendiri | [x] |

### 6.9 Audit Log Data Master (S1-09)

Setelah menjalankan uji di atas, buka tabel `audit_logs` di `npx prisma studio`.

| No | Hasil yang diharapkan | Lulus |
|---|---|---|
| G-06 | Ada baris `STUDENT_CREATE`, `STUDENT_UPDATE`, `STUDENT_IMPORT`, `TEACHER_CREATE`, `PARENT_CREATE`, `SCHEDULE_CREATE`, `SCHEDULE_UPDATE`, `SCHEDULE_DELETE`, `LOCATION_CREATE`, `LOCATION_UPDATE` | [x] |
| G-07 | Ada baris `STUDENT_DEACTIVATE` dan `STUDENT_ACTIVATE` dari uji X-01 sampai X-03 | [x] |
| G-08 | Baris `*_UPDATE` berisi `before` dan `after` di kolom `detail` | [x] |
| G-09 | Tidak ada password atau hash di kolom `detail` (hanya `passwordReset: true/false`) | [x] |

## 7. Pemeriksaan Teknis Sebelum Merge

```bash
npm run lint      # tidak boleh ada error
npm run build     # harus berhasil
```

## 8. Melaporkan Hasil

- Centang kolom **Lulus** pada salinan dokumen ini di deskripsi PR, atau tulis nomor uji yang gagal.
- Untuk uji yang gagal, buat komentar di PR atau GitHub Issue berisi: nomor uji, langkah yang dilakukan, hasil yang terjadi, dan screenshot jika ada.
- Jika database lokal berantakan setelah pengujian, reset dengan `npx prisma migrate reset` (menghapus semua data dan menjalankan ulang migrasi), lalu `npx prisma db seed` untuk mengisi ulang data uji.
