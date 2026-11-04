"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { config } from "@/lib/config";
import type { FormState } from "@/lib/forms";
import { dateToTime } from "@/lib/schedule-time";
import { hhmmToMinutes, zonedToUtc } from "@/lib/time";
import { sessionWindow } from "@/lib/attendance/rules";
import { isSessionOpen, schoolNow, todayRange } from "@/lib/attendance/server";

async function requireTeacher() {
  const user = await requireRole("TEACHER");
  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!teacher) redirect("/login");
  return { user, teacherId: teacher.id };
}

const WINDOW_MESSAGE = {
  WRONG_DAY: "Jadwal ini bukan untuk hari ini.",
  TOO_EARLY: "Sesi belum bisa dibuka.",
  ENDED: "Jam pelajaran ini sudah selesai.",
} as const;

/** FR-03, FR-04: guru membuka sesi absensi untuk jadwal mengajarnya hari ini. */
export async function openSession(scheduleId: number): Promise<FormState> {
  const { user, teacherId } = await requireTeacher();

  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || schedule.teacherId !== teacherId) {
    await logAudit({ userId: user.id, action: "SESSION_OPEN_REJECTED", entity: "schedules", entityId: scheduleId, detail: { reason: "NOT_OWNER" } });
    return { message: "Anda tidak mengajar jadwal ini." };
  }

  const now = schoolNow();
  const start = dateToTime(schedule.startTime);
  const end = dateToTime(schedule.endTime);
  const window = sessionWindow(
    { day: schedule.day, startMinutes: hhmmToMinutes(start), endMinutes: hhmmToMinutes(end) },
    now,
    config.openSessionEarlyMinutes,
  );
  if (!window.ok) {
    const extra =
      window.reason === "TOO_EARLY"
        ? ` Bisa dibuka mulai ${config.openSessionEarlyMinutes} menit sebelum ${start}.`
        : "";
    await logAudit({ userId: user.id, action: "SESSION_OPEN_REJECTED", entity: "schedules", entityId: scheduleId, detail: { reason: window.reason } });
    return { message: WINDOW_MESSAGE[window.reason] + extra };
  }

  // Satu sesi per jadwal per hari. Jika sudah ada, buka kembali sesi yang sama.
  const { start: dayStart, end: dayEnd } = todayRange();
  const existing = await prisma.attendanceSession.findFirst({
    where: { scheduleId, openedAt: { gte: dayStart, lt: dayEnd } },
    orderBy: { openedAt: "desc" },
  });

  let sessionId: number;
  if (existing) {
    sessionId = existing.id;
    if (!isSessionOpen(existing, now.now)) {
      await prisma.attendanceSession.update({ where: { id: existing.id }, data: { status: "ACTIVE" } });
      await logAudit({ userId: user.id, action: "SESSION_REOPEN", entity: "attendance_sessions", entityId: existing.id });
    }
  } else {
    const session = await prisma.attendanceSession.create({
      data: {
        teacherId,
        scheduleId,
        qrToken: randomBytes(32).toString("base64url"),
        openedAt: now.now,
        // QR berlaku sampai jam pelajaran selesai (keputusan tim).
        expiresAt: zonedToUtc(now.date, end, config.timezone),
      },
    });
    sessionId = session.id;
    await logAudit({
      userId: user.id,
      action: "SESSION_OPEN",
      entity: "attendance_sessions",
      entityId: session.id,
      detail: { scheduleId, className: schedule.className, subject: schedule.subject },
    });
  }

  revalidatePath("/guru", "layout");
  redirect(`/guru/sesi/${sessionId}`);
}

export async function closeSession(sessionId: number): Promise<FormState> {
  const { user, teacherId } = await requireTeacher();
  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  if (!session || session.teacherId !== teacherId) return { message: "Sesi tidak ditemukan." };
  if (session.status === "CLOSED") return { success: true, message: "Sesi sudah ditutup." };

  await prisma.attendanceSession.update({ where: { id: sessionId }, data: { status: "CLOSED" } });
  await logAudit({ userId: user.id, action: "SESSION_CLOSE", entity: "attendance_sessions", entityId: sessionId });

  revalidatePath("/guru", "layout");
  return { success: true, message: "Sesi ditutup. QR Code tidak bisa dipakai lagi." };
}
