import Link from "next/link";
import { BookOpenCheck, CalendarDays, FileText, GraduationCap, MapPin } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AutoRefresh } from "@/components/attendance/auto-refresh";
import { SessionsTable, StatTile } from "@/components/attendance/today-overview";
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
    { label: "Siswa aktif", value: students, href: "/admin/siswa", icon: GraduationCap },
    { label: "Guru aktif", value: teachers, href: "/admin/guru", icon: BookOpenCheck },
    { label: "Jadwal pelajaran", value: schedules, href: "/admin/jadwal", icon: CalendarDays },
    { label: "Lokasi aktif", value: locations, href: "/admin/lokasi", icon: MapPin },
    { label: "Izin menunggu", value: pendingLeaves, href: "/admin/izin", icon: FileText },
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      <AutoRefresh seconds={10} />
      <PageHeader
        title={`Halo, ${user.name}`}
        description={`${formatDate(new Date(), config.timezone)} · data diperbarui otomatis setiap 10 detik`}
      />

      <section className="flex flex-col gap-3" aria-labelledby="today-heading">
        <h2 id="today-heading" className="font-semibold">
          Kehadiran hari ini
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" data-testid="today-stats">
          <StatTile label="Sesi aktif" value={t.activeSessions} />
          <StatTile label="Sesi hari ini" value={t.sessions} />
          <StatTile label="Hadir" value={t.hadir} />
          <StatTile label="Terlambat" value={t.terlambat} />
          <StatTile label="Sudah absen selesai" value={t.sudahSelesai} />
          <StatTile label="Tidak absen selesai" value={t.tidakSelesai} tone="danger" />
        </div>
        <SessionsTable sessions={overview.sessions} hrefFor={hrefFor} />
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="master-heading">
        <h2 id="master-heading" className="font-semibold">
          Data master
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {masterData.map(({ label, value, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span>
                <span className="block text-sm text-muted-foreground">{label}</span>
                <span className="text-2xl font-semibold tabular-nums">{value}</span>
              </span>
              <Icon className="size-5 text-muted-foreground" aria-hidden />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
