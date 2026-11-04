// Aturan kehadiran yang murni (tanpa database), agar mudah diuji.
import type { AttendanceStatus } from "@/generated/prisma/enums";

/** FR-08: Terlambat jika check-in lebih dari `lateAfterMinutes` setelah sesi dibuka. */
export function attendanceStatus(openedAt: Date, checkInAt: Date, lateAfterMinutes: number): AttendanceStatus {
  const diffMs = checkInAt.getTime() - openedAt.getTime();
  return diffMs > lateAfterMinutes * 60_000 ? "TERLAMBAT" : "HADIR";
}

export type SessionWindow =
  | { ok: true }
  | { ok: false; reason: "WRONG_DAY" | "TOO_EARLY" | "ENDED"; opensAtMinutes?: number };

/**
 * FR-03: guru hanya boleh membuka sesi pada hari jadwal, mulai `earlyMinutes`
 * sebelum jam mulai sampai sebelum jam selesai. Semua dalam menit waktu lokal.
 */
export function sessionWindow(
  schedule: { day: number; startMinutes: number; endMinutes: number },
  now: { weekday: number; minutes: number },
  earlyMinutes: number,
): SessionWindow {
  if (schedule.day !== now.weekday) return { ok: false, reason: "WRONG_DAY" };
  const opensAt = schedule.startMinutes - earlyMinutes;
  if (now.minutes < opensAt) return { ok: false, reason: "TOO_EARLY", opensAtMinutes: opensAt };
  if (now.minutes >= schedule.endMinutes) return { ok: false, reason: "ENDED" };
  return { ok: true };
}

/** Isi QR: URL halaman absen siswa beserta token, sehingga bisa dibuka juga lewat aplikasi kamera HP. */
export function buildAttendanceUrl(origin: string, token: string) {
  return `${origin.replace(/\/$/, "")}/siswa/absen?t=${encodeURIComponent(token)}`;
}

/** Mengambil token dari hasil scan: bisa berupa URL lengkap atau token saja. */
export function extractToken(scanned: string): string | null {
  const text = scanned.trim();
  try {
    const url = new URL(text);
    const t = url.searchParams.get("t");
    return t && /^[A-Za-z0-9_-]{20,100}$/.test(t) ? t : null;
  } catch {
    return /^[A-Za-z0-9_-]{20,100}$/.test(text) ? text : null;
  }
}
