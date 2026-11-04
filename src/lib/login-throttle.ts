// Pembatasan percobaan login (NFR-02): username dikunci sementara setelah
// terlalu banyak password salah dalam jangka waktu tertentu.
//
// Hitungan diambil dari audit log (LOGIN_FAILED), jadi tidak perlu tabel baru.
// Kunci berlaku per username, bukan per IP, karena satu sekolah biasanya
// keluar lewat satu IP publik yang sama.

export type LockState = { locked: false } | { locked: true; retryAfterMinutes: number };

/**
 * Menentukan apakah username sedang dikunci.
 * `failures` adalah waktu login gagal sejak login berhasil terakhir (urutan bebas).
 */
export function loginLockState(
  failures: Date[],
  now: Date,
  maxAttempts: number,
  windowMinutes: number,
): LockState {
  const windowMs = windowMinutes * 60_000;
  const recent = failures
    .map((d) => d.getTime())
    .filter((t) => t > now.getTime() - windowMs)
    .sort((a, b) => b - a);
  if (recent.length < maxAttempts) return { locked: false };

  // Kunci terbuka saat kegagalan ke-`maxAttempts` (dihitung dari yang terbaru) keluar dari jendela.
  const unlockAt = recent[maxAttempts - 1] + windowMs;
  return { locked: true, retryAfterMinutes: Math.max(1, Math.ceil((unlockAt - now.getTime()) / 60_000)) };
}
