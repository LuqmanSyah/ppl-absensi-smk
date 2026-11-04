import {
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  House,
  LayoutDashboard,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/generated/prisma/enums";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Tambahkan menu baru di sini saat halamannya dibuat (Sprint 2 dan 3).
export const NAV_ITEMS: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/siswa", label: "Siswa", icon: GraduationCap },
    { href: "/admin/guru", label: "Guru", icon: BookOpenCheck },
    { href: "/admin/jadwal", label: "Jadwal", icon: CalendarDays },
    { href: "/admin/lokasi", label: "Lokasi Sekolah", icon: MapPin },
  ],
  TEACHER: [{ href: "/guru", label: "Beranda", icon: House }],
  STUDENT: [{ href: "/siswa", label: "Beranda", icon: House }],
  PARENT: [{ href: "/orang-tua", label: "Beranda", icon: House }],
};
