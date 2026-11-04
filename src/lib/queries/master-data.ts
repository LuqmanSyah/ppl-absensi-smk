// Query bersama untuk pilihan di form data master. Pemanggil wajib sudah memanggil requireRole.
import "server-only";
import { prisma } from "@/lib/prisma";

/** Daftar kelas yang sudah dipakai siswa atau jadwal, untuk saran isian dan filter. */
export async function getClassNames() {
  const [students, schedules] = await Promise.all([
    prisma.student.findMany({ distinct: ["className"], select: { className: true } }),
    prisma.schedule.findMany({ distinct: ["className"], select: { className: true } }),
  ]);
  return [...new Set([...students, ...schedules].map((r) => r.className))].sort((a, b) =>
    a.localeCompare(b, "id", { numeric: true }),
  );
}

export async function getParentOptions() {
  const parents = await prisma.parent.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, user: { select: { username: true, isActive: true } } },
  });
  return parents.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.user.username})${p.user.isActive ? "" : " - nonaktif"}`,
  }));
}

export async function getTeacherOptions() {
  const teachers = await prisma.teacher.findMany({
    where: { user: { isActive: true } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, nip: true },
  });
  return teachers.map((t) => ({ value: t.id, label: `${t.name} (${t.nip})` }));
}
