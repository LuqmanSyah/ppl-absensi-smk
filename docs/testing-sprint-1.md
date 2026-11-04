# Panduan Pengujian Sprint 1

Panduan ini dipakai untuk menguji hasil Sprint 1 (akun, login, hak akses, dan data master) secara manual. Pengujian sebaiknya dilakukan oleh anggota **selain pembuat fitur** (Definition of Done poin 4).

Status cakupan saat ini:

| Item | Fitur | Bisa diuji |
|---|---|---|
| S1-01 | Login, hash argon2, sesi JWT | Ya |
| S1-02 | Guard akses per peran | Ya |
| S1-03 | Layout dan navigasi per peran | Ya |
| S1-09 | Audit log login/logout | Ya (sebagian, data master menyusul) |
| S1-04 sampai S1-08, S1-10, S1-11 | CRUD data master, validasi, nonaktifkan akun, impor CSV | Belum, bagian 6 diisi saat fiturnya selesai |

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
| L-01 | Buka `/login`, kosongkan username dan password, klik **Masuk** | Muncul pesan "Username wajib diisi." dan "Password wajib diisi." | [ ] |
| L-02 | Login dengan `admin` / `salah` | Muncul pesan "Username atau password salah.", username tetap terisi | [ ] |
| L-03 | Login dengan `tidakada` / `password123` | Pesan sama persis dengan L-02 (tidak membocorkan username mana yang terdaftar) | [ ] |
| L-04 | Login dengan `admin` / `password123` | Masuk ke `/admin`, tampil "Halo, Admin TU" | [ ] |
| L-05 | Login sebagai `guru1` | Masuk ke `/guru`, tampil nama "Budi Santoso" | [ ] |
| L-06 | Login sebagai `2024001` | Masuk ke `/siswa`, tampil nama "Rizky Wijaya" | [ ] |
| L-07 | Login sebagai `ortu1` | Masuk ke `/orang-tua`, tampil nama "Ahmad Wijaya" | [ ] |
| L-08 | Setelah login, klik tombol **Keluar** | Kembali ke `/login`; membuka `/admin` lagi diarahkan ke `/login` | [ ] |
| L-09 | Setelah login, buka DevTools → Application → Cookies | Ada cookie `session` dengan centang **HttpOnly** | [ ] |
| L-10 | Hapus cookie `session` lalu refresh halaman | Diarahkan ke `/login` | [ ] |

## 3. Hak Akses per Peran (S1-02)

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| A-01 | Tanpa login, buka `/admin`, `/guru`, `/siswa`, `/orang-tua` | Semua diarahkan ke `/login` | [ ] |
| A-02 | Tanpa login, buka `/` | Diarahkan ke `/login` | [ ] |
| A-03 | Login sebagai siswa, buka `/admin` dan `/admin/siswa` | Ditolak, diarahkan kembali ke `/siswa` (skenario uji no. 2 di `planning.md`) | [ ] |
| A-04 | Login sebagai guru, buka `/siswa` dan `/orang-tua` | Ditolak, diarahkan ke `/guru` | [ ] |
| A-05 | Login sebagai admin, buka `/guru` | Ditolak, diarahkan ke `/admin` | [ ] |
| A-06 | Setelah login, buka `/` | Diarahkan ke halaman awal peran masing-masing | [ ] |
| A-07 | Login sebagai `2024004`. Di terminal lain jalankan `npx prisma studio`, ubah `is_active` user `2024004` menjadi `false`, lalu refresh halaman siswa | Diarahkan ke `/login` walaupun cookie masih ada | [ ] |
| A-08 | Lanjutan A-07: coba login lagi sebagai `2024004` | Ditolak dengan pesan "Akun Anda dinonaktifkan. Hubungi Admin TU." | [ ] |
| A-09 | Kembalikan `is_active` user `2024004` menjadi `true` | Bisa login lagi | [ ] |

## 4. Layout dan Navigasi (S1-03)

Uji di layar desktop dan mode HP (DevTools → Toggle device toolbar, misalnya iPhone SE / 375 px).

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| N-01 | Login admin di layar desktop | Sidebar kiri berisi Dashboard, Siswa, Guru, Jadwal, Lokasi Sekolah | [ ] |
| N-02 | Klik tiap menu di sidebar | Halaman berpindah dan menu yang aktif tersorot | [ ] |
| N-03 | Login admin di mode HP | Sidebar hilang, menu tampil sebagai baris geser horizontal di bawah header | [ ] |
| N-04 | Dashboard admin | Kartu jumlah siswa aktif (6), guru aktif (2), jadwal (3), lokasi aktif (1) sesuai data seed | [ ] |
| N-05 | Login guru/siswa/orang tua di mode HP | Header berisi nama dan tombol Keluar, konten tidak terpotong dan tidak perlu geser ke samping | [ ] |
| N-06 | Klik kartu di dashboard admin | Membuka halaman data yang sesuai | [ ] |

## 5. Audit Log (S1-09, sebagian)

Buka `npx prisma studio`, lalu tabel `audit_logs`. Urutkan berdasarkan `id` terbaru.

| No | Langkah | Hasil yang diharapkan | Lulus |
|---|---|---|---|
| G-01 | Login berhasil | Ada baris `LOGIN` dengan `user_id` akun tersebut dan `ip_address` terisi | [ ] |
| G-02 | Login dengan password salah untuk `admin` | Ada baris `LOGIN_FAILED` dengan `user_id` admin | [ ] |
| G-03 | Login dengan username yang tidak ada | Ada baris `LOGIN_FAILED` dengan `user_id` kosong dan `detail` berisi username | [ ] |
| G-04 | Klik **Keluar** | Ada baris `LOGOUT` | [ ] |
| G-05 | Periksa kolom `detail` semua baris | Tidak ada password, hash, atau token yang tersimpan | [ ] |

## 6. Data Master (S1-04 sampai S1-11)

> Bagian ini dilengkapi oleh PIC masing-masing item saat fiturnya selesai. Gunakan format tabel yang sama: No, Langkah, Hasil yang diharapkan, Lulus.

Hal minimal yang perlu diuji untuk setiap CRUD:
- Tambah data dengan input valid berhasil dan tampil di daftar.
- Input kosong, format salah, atau duplikat (NIS, NIP, username) ditolak dengan pesan yang jelas (FR-17).
- Ubah dan nonaktifkan data berhasil; data yang dinonaktifkan tidak bisa login (S1-10).
- Validasi tetap berjalan walaupun validasi di browser dilewati (misalnya atribut `required` dihapus lewat DevTools).
- Setiap perubahan tercatat di `audit_logs`.
- Hanya Admin yang bisa melakukan perubahan.

## 7. Pemeriksaan Teknis Sebelum Merge

```bash
npm run lint      # tidak boleh ada error
npm run build     # harus berhasil
```

## 8. Melaporkan Hasil

- Centang kolom **Lulus** pada salinan dokumen ini di deskripsi PR, atau tulis nomor uji yang gagal.
- Untuk uji yang gagal, buat komentar di PR atau GitHub Issue berisi: nomor uji, langkah yang dilakukan, hasil yang terjadi, dan screenshot jika ada.
- Jika database lokal berantakan setelah pengujian, reset dengan `npx prisma migrate reset` (menghapus semua data dan menjalankan ulang migrasi), lalu `npx prisma db seed` untuk mengisi ulang data uji.
