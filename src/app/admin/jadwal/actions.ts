"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { fieldError, invalidForm, type FormState } from "@/lib/forms";
import { DAY_LABELS, dateToTime, timeToDate } from "@/lib/schedule-time";
import { scheduleSchema } from "@/lib/validation/master-data";

function readForm(formData: FormData) {
  return {
    teacherId: formData.get("teacherId"),
    className: formData.get("className"),
    subject: formData.get("subject"),
    day: formData.get("day"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  };
}

type ScheduleInput = {
  teacherId: number;
  className: string;
  day: number;
  startTime: string;
  endTime: string;
};

/** Mencari jadwal lain yang bentrok: guru atau kelas yang sama, hari sama, jam beririsan. */
async function findClash(input: ScheduleInput, exceptId?: number) {
  const clash = await prisma.schedule.findFirst({
    where: {
      ...(exceptId && { NOT: { id: exceptId } }),
      day: input.day,
      startTime: { lt: timeToDate(input.endTime) },
      endTime: { gt: timeToDate(input.startTime) },
      OR: [{ teacherId: input.teacherId }, { className: input.className }],
    },
    include: { teacher: { select: { name: true } } },
  });
  if (!clash) return null;

  const when = `${DAY_LABELS[clash.day]} ${dateToTime(clash.startTime)}-${dateToTime(clash.endTime)}`;
  return clash.teacherId === input.teacherId
    ? `Bentrok dengan jadwal ${clash.teacher.name} di ${clash.className} (${clash.subject}, ${when}).`
    : `Kelas ${clash.className} sudah ada pelajaran ${clash.subject} pada ${when}.`;
}

async function activeTeacherExists(teacherId: number) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { user: { select: { isActive: true } } },
  });
  return !!teacher?.user.isActive;
}

export async function createSchedule(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const parsed = scheduleSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalidForm(parsed.error, formData);
  const data = parsed.data;

  if (!(await activeTeacherExists(data.teacherId))) {
    return fieldError("teacherId", "Guru tidak ditemukan atau akunnya nonaktif.", formData);
  }
  const clash = await findClash(data);
  if (clash) return fieldError("startTime", clash, formData);

  const schedule = await prisma.schedule.create({
    data: {
      teacherId: data.teacherId,
      className: data.className,
      subject: data.subject,
      day: data.day,
      startTime: timeToDate(data.startTime),
      endTime: timeToDate(data.endTime),
    },
  });

  await logAudit({
    userId: admin.id,
    action: "SCHEDULE_CREATE",
    entity: "schedules",
    entityId: schedule.id,
    detail: data,
  });

  revalidatePath("/admin/jadwal");
  redirect("/admin/jadwal");
}

export async function updateSchedule(scheduleId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const existing = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!existing) return { message: "Jadwal tidak ditemukan." };

  const parsed = scheduleSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalidForm(parsed.error, formData);
  const data = parsed.data;

  if (data.teacherId !== existing.teacherId && !(await activeTeacherExists(data.teacherId))) {
    return fieldError("teacherId", "Guru tidak ditemukan atau akunnya nonaktif.", formData);
  }
  const clash = await findClash(data, scheduleId);
  if (clash) return fieldError("startTime", clash, formData);

  await prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      teacherId: data.teacherId,
      className: data.className,
      subject: data.subject,
      day: data.day,
      startTime: timeToDate(data.startTime),
      endTime: timeToDate(data.endTime),
    },
  });

  await logAudit({
    userId: admin.id,
    action: "SCHEDULE_UPDATE",
    entity: "schedules",
    entityId: scheduleId,
    detail: {
      before: {
        teacherId: existing.teacherId,
        className: existing.className,
        subject: existing.subject,
        day: existing.day,
        startTime: dateToTime(existing.startTime),
        endTime: dateToTime(existing.endTime),
      },
      after: data,
    },
  });

  revalidatePath("/admin/jadwal", "layout");
  redirect("/admin/jadwal");
}

export async function deleteSchedule(scheduleId: number): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const existing = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { _count: { select: { sessions: true } } },
  });
  if (!existing) return { message: "Jadwal tidak ditemukan." };
  if (existing._count.sessions > 0) {
    return {
      message: `Jadwal tidak bisa dihapus karena sudah dipakai di ${existing._count.sessions} sesi absensi. Ubah jadwalnya saja.`,
    };
  }

  await prisma.schedule.delete({ where: { id: scheduleId } });
  await logAudit({
    userId: admin.id,
    action: "SCHEDULE_DELETE",
    entity: "schedules",
    entityId: scheduleId,
    detail: {
      teacherId: existing.teacherId,
      className: existing.className,
      subject: existing.subject,
      day: existing.day,
      startTime: dateToTime(existing.startTime),
      endTime: dateToTime(existing.endTime),
    },
  });

  revalidatePath("/admin/jadwal", "layout");
  redirect("/admin/jadwal");
}
