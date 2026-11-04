// Data Access Layer: satu-satunya tempat untuk mengetahui siapa pengguna saat ini.
// Panggil `requireRole` di setiap page, Server Action, dan Route Handler yang dilindungi.
// Proxy hanya pemeriksaan awal; pemeriksaan yang berlaku ada di sini (NFR-02).
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/roles";

export type CurrentUser = {
  id: number;
  username: string;
  role: Role;
  name: string;
};

/** Pengguna yang sedang login, atau `null`. Akun nonaktif dianggap tidak login. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      admin: { select: { name: true } },
      teacher: { select: { name: true } },
      student: { select: { name: true } },
      parent: { select: { name: true } },
    },
  });
  if (!user || !user.isActive) return null;

  const name =
    user.admin?.name ?? user.teacher?.name ?? user.student?.name ?? user.parent?.name ?? user.username;

  // Peran diambil dari database, bukan dari token, agar perubahan peran langsung berlaku.
  return { id: user.id, username: user.username, role: user.role, name };
});

/** Memastikan pengguna login dengan salah satu peran yang diizinkan. */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect(ROLE_HOME[user.role]);
  return user;
}
