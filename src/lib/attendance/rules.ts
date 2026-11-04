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

export type LessonTimes = {
  /** Jam mulai pelajaran pada hari sesi (UTC). */
  start: Date;
  /** Jam selesai pelajaran pada hari sesi (UTC). */
  end: Date;
};

/**
 * Jendela absen selesai (pengganti pemantauan berkala): dibuka setelah `afterPercent`% durasi
 * pelajaran berlalu dihitung dari jam mulai jadwal, dan ditutup `graceMinutes` setelah jam selesai.
 * Contoh: pelajaran 07:00-07:30, 2/3 -> dibuka 07:20, ditutup 07:40.
 */
export function checkoutWindow(lesson: LessonTimes, afterPercent: number, graceMinutes: number) {
  const duration = lesson.end.getTime() - lesson.start.getTime();
  // Dibulatkan ke bawah ke menit penuh: 30 menit x 66,67% = 20,001 -> menit ke-20.
  const opensAt = new Date(lesson.start.getTime() + Math.floor((duration * afterPercent) / 100 / 60_000) * 60_000);
  const closesAt = new Date(lesson.end.getTime() + graceMinutes * 60_000);
  return { opensAt, closesAt };
}

export type AttendancePhase = "CHECK_IN" | "WAIT_CHECKOUT" | "CHECKOUT" | "CLOSED";

/**
 * Apa yang boleh dilakukan siswa pada waktu `now`:
 * absen masuk hanya sampai jam selesai, absen selesai hanya di dalam jendela absen selesai.
 */
export function attendancePhase(
  now: Date,
  lesson: LessonTimes,
  window: { opensAt: Date; closesAt: Date },
  checkedIn: boolean,
): AttendancePhase {
  if (!checkedIn) return now < lesson.end ? "CHECK_IN" : "CLOSED";
  if (now < window.opensAt) return "WAIT_CHECKOUT";
  if (now <= window.closesAt) return "CHECKOUT";
  return "CLOSED";
}
