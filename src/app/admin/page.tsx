import Link from "next/link";
import { BookOpenCheck, CalendarDays, FileText, GraduationCap, MapPin } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const user = await requireRole("ADMIN");
  const [students, teachers, schedules, locations, pendingLeaves] = await Promise.all([
    prisma.student.count({ where: { user: { isActive: true } } }),
    prisma.teacher.count({ where: { user: { isActive: true } } }),
    prisma.schedule.count(),
    prisma.schoolLocation.count({ where: { isActive: true } }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
  ]);

  const stats = [
    { label: "Siswa aktif", value: students, href: "/admin/siswa", icon: GraduationCap },
    { label: "Guru aktif", value: teachers, href: "/admin/guru", icon: BookOpenCheck },
    { label: "Jadwal pelajaran", value: schedules, href: "/admin/jadwal", icon: CalendarDays },
    { label: "Lokasi aktif", value: locations, href: "/admin/lokasi", icon: MapPin },
    { label: "Izin menunggu", value: pendingLeaves, href: "/admin/izin", icon: FileText },
  ] as const;

  return (
    <>
      <PageHeader title={`Halo, ${user.name}`} description="Ringkasan data master sekolah." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value, href, icon: Icon }) => (
          <Link key={href} href={href} className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
