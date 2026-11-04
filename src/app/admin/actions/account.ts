"use server";

// Aktif/nonaktifkan akun (S1-10). Akun tidak pernah dihapus agar riwayat absensi tetap utuh.
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import type { FormState } from "@/lib/forms";
import { ROLE_HOME } from "@/lib/roles";

const ENTITY_BY_ROLE = {
  STUDENT: { entity: "students", prefix: "STUDENT", path: "/admin/siswa" },
  TEACHER: { entity: "teachers", prefix: "TEACHER", path: "/admin/guru" },
  PARENT: { entity: "parents", prefix: "PARENT", path: "/admin/orang-tua" },
} as const;

export async function setUserActive(userId: number, active: boolean): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, username: true },
  });
  if (!user) return { message: "Akun tidak ditemukan." };
  if (user.role === "ADMIN") return { message: "Akun admin tidak bisa diubah dari halaman ini." };

  await prisma.user.update({ where: { id: userId }, data: { isActive: active } });

  const meta = ENTITY_BY_ROLE[user.role];
  await logAudit({
    userId: admin.id,
    action: `${meta.prefix}_${active ? "ACTIVATE" : "DEACTIVATE"}`,
    entity: "users",
    entityId: user.id,
    detail: { username: user.username },
  });

  revalidatePath(meta.path, "layout");
  revalidatePath(ROLE_HOME.ADMIN);
  return {
    success: true,
    message: active ? "Akun diaktifkan kembali." : "Akun dinonaktifkan. Pengguna tidak bisa login lagi.",
  };
}
