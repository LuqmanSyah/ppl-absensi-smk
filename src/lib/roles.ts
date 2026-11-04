import type { Role } from "@/generated/prisma/enums";

/** Halaman awal tiap peran setelah login. */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  TEACHER: "/guru",
  STUDENT: "/siswa",
  PARENT: "/orang-tua",
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin TU",
  TEACHER: "Guru",
  STUDENT: "Siswa",
  PARENT: "Orang Tua",
};

/** Peran yang boleh membuka sebuah path, atau `null` jika path tidak dilindungi. */
export function roleForPath(pathname: string): Role | null {
  for (const [role, home] of Object.entries(ROLE_HOME) as [Role, string][]) {
    if (pathname === home || pathname.startsWith(`${home}/`)) return role;
  }
  return null;
}
