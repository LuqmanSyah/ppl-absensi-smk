import {
  BookOpenCheck,
  BarChart3,
  ClipboardList,
  FileText,
  History,
  QrCode,
  CalendarDays,
  GraduationCap,
  House,
  LayoutDashboard,
  MapPin,
  Users,
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
    { href: "/admin/orang-tua", label: "Orang Tua", icon: Users },
    { href: "/admin/jadwal", label: "Jadwal", icon: CalendarDays },
    { href: "/admin/lokasi", label: "Lokasi Sekolah", icon: MapPin },
    { href: "/admin/izin", label: "Izin & Sakit", icon: FileText },
    { href: "/admin/laporan", label: "Laporan", icon: BarChart3 },
  ],
  TEACHER: [
    { href: "/guru", label: "Beranda", icon: House },
    { href: "/guru/sesi", label: "Riwayat Sesi", icon: ClipboardList },
  ],
  STUDENT: [
    { href: "/siswa", label: "Beranda", icon: House },
    { href: "/siswa/absen", label: "Absen", icon: QrCode },
    { href: "/siswa/riwayat", label: "Riwayat", icon: History },
    { href: "/siswa/izin", label: "Izin", icon: FileText },
  ],
  PARENT: [{ href: "/orang-tua", label: "Beranda", icon: House }],
};
