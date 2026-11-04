"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { fieldError, invalidForm, type FormState } from "@/lib/forms";
import { teacherCreateSchema, teacherUpdateSchema } from "@/lib/validation/master-data";

function readForm(formData: FormData) {
  return {
    nip: formData.get("nip"),
    name: formData.get("name"),
    username: formData.get("username"),
    password: formData.get("password"),
  };
}

async function findConflict(nip: string, username: string, exceptTeacherId?: number, exceptUserId?: number) {
  const [byNip, byUsername] = await Promise.all([
    prisma.teacher.findUnique({ where: { nip }, select: { id: true } }),
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
  ]);
  if (byNip && byNip.id !== exceptTeacherId) return { field: "nip", message: "NIP sudah terdaftar." };
  if (byUsername && byUsername.id !== exceptUserId) return { field: "username", message: "Username sudah dipakai." };
  return null;
}

export async function createTeacher(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const parsed = teacherCreateSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalidForm(parsed.error, formData);
  const data = parsed.data;

  const conflict = await findConflict(data.nip, data.username);
  if (conflict) return fieldError(conflict.field, conflict.message, formData);

  const teacher = await prisma.teacher.create({
    data: {
      nip: data.nip,
      name: data.name,
      user: {
        create: { username: data.username, role: "TEACHER", passwordHash: await hashPassword(data.password) },
      },
    },
  });

  await logAudit({
    userId: admin.id,
    action: "TEACHER_CREATE",
    entity: "teachers",
    entityId: teacher.id,
    detail: { nip: teacher.nip, name: teacher.name, username: data.username },
  });

  revalidatePath("/admin/guru");
  redirect("/admin/guru");
}

export async function updateTeacher(teacherId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const existing = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { user: { select: { id: true, username: true } } },
  });
  if (!existing) return { message: "Data guru tidak ditemukan." };

  const parsed = teacherUpdateSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalidForm(parsed.error, formData);
  const data = parsed.data;

  const conflict = await findConflict(data.nip, data.username, teacherId, existing.userId);
  if (conflict) return fieldError(conflict.field, conflict.message, formData);

  const passwordHash = data.password ? await hashPassword(data.password) : undefined;

  await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      nip: data.nip,
      name: data.name,
      user: { update: { username: data.username, ...(passwordHash && { passwordHash }) } },
    },
  });

  await logAudit({
    userId: admin.id,
    action: "TEACHER_UPDATE",
    entity: "teachers",
    entityId: teacherId,
    detail: {
      before: { nip: existing.nip, name: existing.name, username: existing.user.username },
      after: { nip: data.nip, name: data.name, username: data.username },
      passwordReset: !!passwordHash,
    },
  });

  revalidatePath("/admin/guru", "layout");
  redirect("/admin/guru");
}
