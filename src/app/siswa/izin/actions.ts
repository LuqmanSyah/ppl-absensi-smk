"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { fieldError, invalidForm, type FormState } from "@/lib/forms";
import { dateOnly, schoolNow } from "@/lib/attendance/server";
import { LEAVE_MAX_BACKDATE_DAYS, LEAVE_MAX_DAYS, leaveSchema } from "@/lib/validation/leave";

const DAY_MS = 24 * 60 * 60 * 1000;

async function requireStudent() {
  const user = await requireRole("STUDENT");
  const student = await prisma.student.findUniqueOrThrow({ where: { userId: user.id }, select: { id: true } });
  return { user, studentId: student.id };
}

export async function createLeaveRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, studentId } = await requireStudent();

  const parsed = leaveSchema.safeParse({
    type: formData.get("type"),
    dateFrom: formData.get("dateFrom"),
    dateTo: formData.get("dateTo"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return invalidForm(parsed.error, formData);
  const data = parsed.data;

  const from = dateOnly(data.dateFrom);
  const to = dateOnly(data.dateTo);
  const today = dateOnly(schoolNow().date);

  if ((today.getTime() - from.getTime()) / DAY_MS > LEAVE_MAX_BACKDATE_DAYS) {
    return fieldError("dateFrom", `Pengajuan paling lambat ${LEAVE_MAX_BACKDATE_DAYS} hari setelah tanggal izin.`, formData);
  }
  if ((from.getTime() - today.getTime()) / DAY_MS > 30) {
    return fieldError("dateFrom", "Pengajuan paling cepat 30 hari sebelumnya.", formData);
  }
  if ((to.getTime() - from.getTime()) / DAY_MS + 1 > LEAVE_MAX_DAYS) {
    return fieldError("dateTo", `Satu pengajuan maksimal ${LEAVE_MAX_DAYS} hari.`, formData);
  }

  const overlap = await prisma.leaveRequest.findFirst({
    where: { studentId, status: { in: ["PENDING", "APPROVED"] }, dateFrom: { lte: to }, dateTo: { gte: from } },
  });
  if (overlap) {
    return fieldError("dateFrom", "Sudah ada pengajuan lain yang menunggu atau disetujui pada tanggal tersebut.", formData);
  }

  const leave = await prisma.leaveRequest.create({
    data: { studentId, type: data.type, dateFrom: from, dateTo: to, reason: data.reason },
  });
  await logAudit({ userId: user.id, action: "LEAVE_CREATE", entity: "leave_requests", entityId: leave.id, detail: { type: data.type, dateFrom: data.dateFrom, dateTo: data.dateTo } });

  revalidatePath("/siswa", "layout");
  revalidatePath("/admin/izin");
  return { success: true, message: "Pengajuan terkirim dan menunggu konfirmasi Admin TU.", values: {} };
}

export async function cancelLeaveRequest(leaveId: number): Promise<FormState> {
  const { user, studentId } = await requireStudent();
  const leave = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
  if (!leave || leave.studentId !== studentId) return { message: "Pengajuan tidak ditemukan." };
  if (leave.status !== "PENDING") return { message: "Pengajuan yang sudah diproses tidak bisa dibatalkan." };

  await prisma.leaveRequest.delete({ where: { id: leaveId } });
  await logAudit({ userId: user.id, action: "LEAVE_CANCEL", entity: "leave_requests", entityId: leaveId });
  revalidatePath("/siswa", "layout");
  revalidatePath("/admin/izin");
  return { success: true, message: "Pengajuan dibatalkan." };
}
