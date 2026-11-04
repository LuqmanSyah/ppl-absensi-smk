// Helper server untuk fitur absensi. Pemanggil wajib sudah memanggil requireRole.
import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { zonedDayRange, zonedParts, zonedToUtc } from "@/lib/time";
import { dateToTime } from "@/lib/schedule-time";
import { checkoutWindow } from "./rules";

/** Waktu server saat ini dalam zona waktu sekolah (NFR-03: tidak pernah memakai jam perangkat). */
export function schoolNow() {
  const now = new Date();
  return { now, ...zonedParts(now, config.timezone) };
}

export function todayRange() {
  return zonedDayRange(schoolNow().date, config.timezone);
}

export function getActiveLocation() {
  return prisma.schoolLocation.findFirst({ where: { isActive: true }, orderBy: { id: "asc" } });
}

/** Alamat aplikasi untuk isi QR. Pakai APP_URL jika diisi, selain itu dari header permintaan. */
export async function getAppOrigin() {
  if (process.env.APP_URL) return process.env.APP_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Sesi masih bisa dipakai untuk absen: status aktif dan belum melewati jam selesai. */
export function isSessionOpen(session: { status: string; expiresAt: Date }, now = new Date()) {
  return session.status === "ACTIVE" && session.expiresAt > now;
}

/** "YYYY-MM-DD" -> Date untuk kolom @db.Date (tengah malam UTC). */
export function dateOnly(date: string) {
  return new Date(`${date}T00:00:00Z`);
}


/**
 * Jam pelajaran dan jendela absen selesai untuk satu sesi, dihitung dari jadwal pada tanggal sesi.
 * Absen selesai dibuka setelah 2/3 pelajaran (CHECKOUT_AFTER_PERCENT) dan ditutup
 * CHECKOUT_GRACE_MINUTES setelah jam selesai.
 */
export function lessonTimes(session: { openedAt: Date; schedule: { startTime: Date; endTime: Date } }) {
  const date = zonedParts(session.openedAt, config.timezone).date;
  const lesson = {
    start: zonedToUtc(date, dateToTime(session.schedule.startTime), config.timezone),
    end: zonedToUtc(date, dateToTime(session.schedule.endTime), config.timezone),
  };
  return { ...lesson, ...checkoutWindow(lesson, config.checkoutAfterPercent, config.checkoutGraceMinutes) };
}
