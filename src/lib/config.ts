// Aturan bisnis yang bisa diatur lewat environment tanpa mengubah kode.
// Nilai default mengikuti keputusan tim (lihat docs/planning.md bagian 10).

function intEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const config = {
  /** Zona waktu sekolah. */
  timezone: process.env.APP_TIMEZONE || "Asia/Jakarta",
  /** Siswa Terlambat jika check-in lebih dari N menit setelah sesi dibuka (FR-08). */
  lateAfterMinutes: intEnv("LATE_AFTER_MINUTES", 5),
  /** Akurasi GPS terburuk yang masih diterima, dalam meter (NFR-06). */
  maxGpsAccuracyM: intEnv("MAX_GPS_ACCURACY_M", 50),
  /** Guru boleh membuka sesi N menit sebelum jam pelajaran dimulai. */
  openSessionEarlyMinutes: intEnv("OPEN_SESSION_EARLY_MINUTES", 15),
  /** Absen selesai baru bisa dilakukan setelah sekian persen durasi pelajaran berlalu (default 2/3). */
  checkoutAfterPercent: Math.min(100, intEnv("CHECKOUT_AFTER_PERCENT", 66.67)),
  /** Absen selesai masih diterima sekian menit setelah jam pelajaran berakhir. */
  checkoutGraceMinutes: intEnv("CHECKOUT_GRACE_MINUTES", 10),
  /** Username dikunci sementara setelah sekian kali password salah (NFR-02). */
  loginMaxAttempts: intEnv("LOGIN_MAX_ATTEMPTS", 5),
  /** Jendela hitungan login gagal sekaligus lama kunci, dalam menit. */
  loginLockMinutes: intEnv("LOGIN_LOCK_MINUTES", 15),
};
