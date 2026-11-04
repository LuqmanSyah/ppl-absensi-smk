// Data dashboard kehadiran hari ini (FR-15). Pemanggil wajib sudah memanggil requireRole.
import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isSessionOpen, todayRange } from "./server";

export type SessionOverview = {
  id: number;
  subject: string;
  className: string;
  teacherName: string;
  openedAt: Date;
  expiresAt: Date;
  open: boolean;
  totalStudents: number;
  hadir: number;
  terlambat: number;
  /** Sudah absen selesai. */
  sudahSelesai: number;
  /** Hadir tetapi tidak absen selesai sampai sesi berakhir. */
  tidakSelesai: number;
};

/** Ringkasan semua sesi hari ini; `where` untuk membatasi, misalnya hanya sesi milik satu guru. */
export async function getTodayOverview(where: Prisma.AttendanceSessionWhereInput = {}) {
  const { start, end } = todayRange();
  const now = new Date();

  const sessions = await prisma.attendanceSession.findMany({
    where: { ...where, openedAt: { gte: start, lt: end } },
    orderBy: { openedAt: "desc" },
    include: {
      schedule: { select: { subject: true, className: true } },
      teacher: { select: { name: true } },
      attendances: { select: { status: true, checkOutAt: true } },
    },
  });

  const classNames = [...new Set(sessions.map((s) => s.schedule.className))];
  const classCounts = await prisma.student.groupBy({
    by: ["className"],
    where: { className: { in: classNames }, user: { isActive: true } },
    _count: { _all: true },
  });
  const studentsInClass = new Map(classCounts.map((c) => [c.className, c._count._all]));

  const overview: SessionOverview[] = sessions.map((s) => {
    const open = isSessionOpen(s, now);
    return {
      id: s.id,
      subject: s.schedule.subject,
      className: s.schedule.className,
      teacherName: s.teacher.name,
      openedAt: s.openedAt,
      expiresAt: s.expiresAt,
      open,
      totalStudents: studentsInClass.get(s.schedule.className) ?? 0,
      hadir: s.attendances.filter((a) => a.status === "HADIR").length,
      terlambat: s.attendances.filter((a) => a.status === "TERLAMBAT").length,
      sudahSelesai: s.attendances.filter((a) => a.checkOutAt).length,
      tidakSelesai: open ? 0 : s.attendances.filter((a) => !a.checkOutAt).length,
    };
  });

  const sum = (key: keyof Pick<SessionOverview, "hadir" | "terlambat" | "sudahSelesai" | "tidakSelesai">) =>
    overview.reduce((n, s) => n + s[key], 0);

  return {
    sessions: overview,
    totals: {
      activeSessions: overview.filter((s) => s.open).length,
      sessions: overview.length,
      hadir: sum("hadir"),
      terlambat: sum("terlambat"),
      sudahSelesai: sum("sudahSelesai"),
      tidakSelesai: sum("tidakSelesai"),
    },
  };
}

