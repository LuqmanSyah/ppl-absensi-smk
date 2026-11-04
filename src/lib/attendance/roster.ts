// Daftar kehadiran satu sesi (FR-13): semua siswa aktif di kelas tersebut beserta statusnya.
import "server-only";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { zonedParts } from "@/lib/time";
import { dateOnly } from "./server";

export type RosterStatus = "HADIR" | "TERLAMBAT" | "IZIN" | "SAKIT" | "MENUNGGU_IZIN" | "BELUM";

export type RosterRow = {
  studentId: number;
  nis: string;
  name: string;
  status: RosterStatus;
  checkInAt: Date | null;
  checkOutAt: Date | null;
};

export async function getSessionRoster(session: { id: number; openedAt: Date; schedule: { className: string } }) {
  const sessionDate = dateOnly(zonedParts(session.openedAt, config.timezone).date);

  const students = await prisma.student.findMany({
    where: { className: session.schedule.className, user: { isActive: true } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      nis: true,
      name: true,
      attendances: {
        where: { sessionId: session.id },
        select: { status: true, checkInAt: true, checkOutAt: true },
      },
      leaveRequests: {
        where: { status: { in: ["APPROVED", "PENDING"] }, dateFrom: { lte: sessionDate }, dateTo: { gte: sessionDate } },
        select: { type: true, status: true },
      },
    },
  });

  const rows: RosterRow[] = students.map((s) => {
    const attendance = s.attendances[0];
    const approved = s.leaveRequests.find((l) => l.status === "APPROVED");
    const pending = s.leaveRequests.find((l) => l.status === "PENDING");
    // Catatan hadir lebih kuat daripada izin: jika siswa tetap datang, dia tercatat hadir.
    const status: RosterStatus = attendance
      ? attendance.status
      : approved
        ? approved.type
        : pending
          ? "MENUNGGU_IZIN"
          : "BELUM";
    return {
      studentId: s.id,
      nis: s.nis,
      name: s.name,
      status,
      checkInAt: attendance?.checkInAt ?? null,
      checkOutAt: attendance?.checkOutAt ?? null,
    };
  });

  const count = (status: RosterStatus) => rows.filter((r) => r.status === status).length;
  return {
    rows,
    summary: {
      total: rows.length,
      hadir: count("HADIR"),
      terlambat: count("TERLAMBAT"),
      izin: count("IZIN") + count("SAKIT"),
      belum: count("BELUM") + count("MENUNGGU_IZIN"),
    },
  };
}
