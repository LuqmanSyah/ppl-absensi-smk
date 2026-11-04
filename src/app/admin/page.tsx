import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenCheck,
  CalendarDays,
  CircleCheck,
  Clock3,
  FileText,
  GraduationCap,
  LogOut,
  MapPin,
  Radio,
  TimerOff,
  ClipboardList,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AutoRefresh } from "@/components/attendance/auto-refresh";
import { SessionsTable, StatTile, TONE_CHIP } from "@/components/attendance/today-overview";
import { cn } from "@/lib/utils";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { formatDate } from "@/lib/time";
import { getTodayOverview } from "@/lib/attendance/dashboard";

export default async function AdminDashboardPage() {
  const user = await requireRole("ADMIN");
  const [overview, students, teachers, schedules, locations, pendingLeaves] = await Promise.all([
    getTodayOverview(),
    prisma.student.count({ where: { user: { isActive: true } } }),
    prisma.teacher.count({ where: { user: { isActive: true } } }),
    prisma.schedule.count(),
    prisma.schoolLocation.count({ where: { isActive: true } }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
  ]);
  const t = overview.totals;
  const hrefFor = (id: number) => `/admin/sesi/${id}`;

  const masterData = [
    { label: "Siswa aktif", value: students, href: "/admin/siswa", icon: GraduationCap, tone: "primary" },
    { label: "Guru aktif", value: teachers, href: "/admin/guru", icon: BookOpenCheck, tone: "info" },
    { label: "Jadwal pelajaran", value: schedules, href: "/admin/jadwal", icon: CalendarDays, tone: "success" },
    { label: "Lokasi aktif", value: locations, href: "/admin/lokasi", icon: MapPin, tone: "neutral" },
    { label: "Izin menunggu", value: pendingLeaves, href: "/admin/izin", icon: FileText, tone: pendingLeaves > 0 ? "warning" : "neutral" },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh seconds={10} />
      <PageHeader
        title={`Halo, ${user.name}`}
        description={`${formatDate(new Date(), config.timezone)} · data diperbarui otomatis setiap 10 detik`}
      />

      <section className="flex flex-col gap-3" aria-labelledby="today-heading">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="today-heading" className="text-lg font-semibold">
            Kehadiran hari ini
          </h2>
          {t.activeSessions > 0 && <span className="text-xs text-muted-foreground">{t.activeSessions} sesi sedang berjalan</span>}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6" data-testid="today-stats">
          <StatTile label="Sesi aktif" value={t.activeSessions} icon={Radio} tone="primary" />
          <StatTile label="Sesi hari ini" value={t.sessions} icon={ClipboardList} tone="neutral" />
          <StatTile label="Hadir" value={t.hadir} icon={CircleCheck} tone="success" />
          <StatTile label="Terlambat" value={t.terlambat} icon={Clock3} tone="warning" />
          <StatTile label="Sudah absen selesai" value={t.sudahSelesai} icon={LogOut} tone="info" />
          <StatTile label="Tidak absen selesai" value={t.tidakSelesai} icon={TimerOff} tone="danger" />
        </div>
        <SessionsTable sessions={overview.sessions} hrefFor={hrefFor} />
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="master-heading">
        <h2 id="master-heading" className="text-lg font-semibold">
          Data master
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {masterData.map(({ label, value, href, icon: Icon, tone }) => (
            <Link
              key={href}
              href={href}
              className="group surface flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", TONE_CHIP[tone])} aria-hidden>
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-muted-foreground">{label}</span>
                <span className="text-2xl font-bold tabular-nums">{value}</span>
              </span>
              <ArrowUpRight
                className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
