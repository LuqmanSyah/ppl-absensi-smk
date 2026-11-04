"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { fieldError, invalidForm, type FormState } from "@/lib/forms";
import { studentCreateSchema, studentUpdateSchema } from "@/lib/validation/master-data";

function readForm(formData: FormData) {
  return {
    nis: formData.get("nis"),
    name: formData.get("name"),
    className: formData.get("className"),
    parentId: formData.get("parentId"),
    password: formData.get("password"),
  };
}

/** NIS dipakai juga sebagai username, jadi harus unik di kedua tabel. */
async function nisTaken(nis: string, exceptStudentId?: number) {
  const [student, user] = await Promise.all([
    prisma.student.findUnique({ where: { nis }, select: { id: true } }),
    prisma.user.findUnique({ where: { username: nis }, select: { student: { select: { id: true } } } }),
  ]);
  if (student && student.id !== exceptStudentId) return true;
  if (user && (exceptStudentId === undefined || user.student?.id !== exceptStudentId)) return true;
  return false;
}

async function parentExists(parentId: number | undefined) {
  if (!parentId) return true;
  return !!(await prisma.parent.findUnique({ where: { id: parentId }, select: { id: true } }));
}

export async function createStudent(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const parsed = studentCreateSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalidForm(parsed.error, formData);
  const data = parsed.data;

  if (await nisTaken(data.nis)) return fieldError("nis", "NIS sudah terdaftar.", formData);
  if (!(await parentExists(data.parentId))) return fieldError("parentId", "Orang tua tidak ditemukan.", formData);

  const student = await prisma.student.create({
    data: {
      nis: data.nis,
      name: data.name,
      className: data.className,
      parent: data.parentId ? { connect: { id: data.parentId } } : undefined,
      user: {
        create: { username: data.nis, role: "STUDENT", passwordHash: await hashPassword(data.password) },
      },
    },
  });

  await logAudit({
    userId: admin.id,
    action: "STUDENT_CREATE",
    entity: "students",
    entityId: student.id,
    detail: { nis: student.nis, name: student.name, className: student.className },
  });

  revalidatePath("/admin/siswa");
  redirect("/admin/siswa");
}

export async function updateStudent(studentId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const existing = await prisma.student.findUnique({ where: { id: studentId } });
  if (!existing) return { message: "Data siswa tidak ditemukan." };

  const parsed = studentUpdateSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalidForm(parsed.error, formData);
  const data = parsed.data;

  if (await nisTaken(data.nis, studentId)) return fieldError("nis", "NIS sudah terdaftar.", formData);
  if (!(await parentExists(data.parentId))) return fieldError("parentId", "Orang tua tidak ditemukan.", formData);

  const passwordHash = data.password ? await hashPassword(data.password) : undefined;

  await prisma.student.update({
    where: { id: studentId },
    data: {
      nis: data.nis,
      name: data.name,
      className: data.className,
      parent: data.parentId ? { connect: { id: data.parentId } } : { disconnect: true },
      // Username siswa selalu mengikuti NIS.
      user: { update: { username: data.nis, ...(passwordHash && { passwordHash }) } },
    },
  });

  await logAudit({
    userId: admin.id,
    action: "STUDENT_UPDATE",
    entity: "students",
    entityId: studentId,
    detail: {
      before: { nis: existing.nis, name: existing.name, className: existing.className, parentId: existing.parentId },
      after: { nis: data.nis, name: data.name, className: data.className, parentId: data.parentId ?? null },
      passwordReset: !!passwordHash,
    },
  });

  revalidatePath("/admin/siswa", "layout");
  redirect("/admin/siswa");
}
