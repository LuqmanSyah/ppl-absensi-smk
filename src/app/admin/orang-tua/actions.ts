"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { fieldError, invalidForm, type FormState } from "@/lib/forms";
import { parentCreateSchema, parentUpdateSchema } from "@/lib/validation/master-data";

function readForm(formData: FormData) {
  return {
    name: formData.get("name"),
    username: formData.get("username"),
    password: formData.get("password"),
  };
}

async function usernameTaken(username: string, exceptUserId?: number) {
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  return !!user && user.id !== exceptUserId;
}

export async function createParent(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const parsed = parentCreateSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalidForm(parsed.error, formData);
  const data = parsed.data;

  if (await usernameTaken(data.username)) return fieldError("username", "Username sudah dipakai.", formData);

  const parent = await prisma.parent.create({
    data: {
      name: data.name,
      user: {
        create: { username: data.username, role: "PARENT", passwordHash: await hashPassword(data.password) },
      },
    },
  });

  await logAudit({
    userId: admin.id,
    action: "PARENT_CREATE",
    entity: "parents",
    entityId: parent.id,
    detail: { name: parent.name, username: data.username },
  });

  revalidatePath("/admin/orang-tua");
  redirect("/admin/orang-tua");
}

export async function updateParent(parentId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const existing = await prisma.parent.findUnique({
    where: { id: parentId },
    include: { user: { select: { id: true, username: true } } },
  });
  if (!existing) return { message: "Data orang tua tidak ditemukan." };

  const parsed = parentUpdateSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalidForm(parsed.error, formData);
  const data = parsed.data;

  if (await usernameTaken(data.username, existing.userId)) {
    return fieldError("username", "Username sudah dipakai.", formData);
  }

  const passwordHash = data.password ? await hashPassword(data.password) : undefined;

  await prisma.parent.update({
    where: { id: parentId },
    data: {
      name: data.name,
      user: { update: { username: data.username, ...(passwordHash && { passwordHash }) } },
    },
  });

  await logAudit({
    userId: admin.id,
    action: "PARENT_UPDATE",
    entity: "parents",
    entityId: parentId,
    detail: {
      before: { name: existing.name, username: existing.user.username },
      after: { name: data.name, username: data.username },
      passwordReset: !!passwordHash,
    },
  });

  revalidatePath("/admin/orang-tua", "layout");
  redirect("/admin/orang-tua");
}
