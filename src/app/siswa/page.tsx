import Link from "next/link";
import { QrCode } from "lucide-react";
import { AttendanceBadge } from "@/components/attendance/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { dateToTime } from "@/lib/schedule-time";
import { formatDate, formatTime } from "@/lib/time";
import { isSessionOpen, schoolNow, todayRange } from "@/lib/attendance/server";

export default async function StudentHomePage() {
  const user = await requireRole("STUDENT");
  const student = await prisma.student.findUniqueOrThrow({ where: { userId: user.id }, select: { id: true, className: true } });
  const now = schoolNow();
  const { start, end } = todayRange();
  const tz = config.timezone;

  const schedules = await prisma.schedule.findMany({
    where: { className: student.className, day: now.weekday },
    orderBy: { startTime: "asc" },
    include: {
      teacher: { select: { name: true } },
      sessions: {
        where: { openedAt: { gte: start, lt: end } },
        orderBy: { openedAt: "desc" },
        take: 1,
        include: { attendances: { where: { studentId: student.id } } },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Halo, {user.name}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(now.now, tz)} · Kelas {student.className}
        </p>
      </div>

      <Link href="/siswa/absen" className={buttonVariants({ size: "lg", className: "h-14 text-base" })}>
        <QrCode aria-hidden className="size-5" />
        Scan QR untuk absen
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Pelajaran hari ini</h2>
        {schedules.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada jadwal pelajaran hari ini.</p>}
        {schedules.map((s) => {
          const session = s.sessions[0];
          const attendance = session?.attendances[0];
          const open = session ? isSessionOpen(session, now.now) : false;
          return (
            <Card key={s.id} size="sm">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                  {s.subject}
                  {attendance ? (
                    <AttendanceBadge status={attendance.status} />
                  ) : open ? (
                    <span className="text-xs font-normal text-primary">Sesi dibuka, silakan absen</span>
                  ) : session ? (
                    <AttendanceBadge status="BELUM" ended />
                  ) : null}
                </CardTitle>
                <CardDescription>
                  {dateToTime(s.startTime)}-{dateToTime(s.endTime)} · {s.teacher.name}
                </CardDescription>
              </CardHeader>
              {attendance && (
                <CardContent className="text-sm text-muted-foreground">
                  Masuk {formatTime(attendance.checkInAt!, tz)}
                  {attendance.checkOutAt && ` · Pulang ${formatTime(attendance.checkOutAt, tz)}`}
                </CardContent>
              )}
            </Card>
          );
        })}
      </section>
    </div>
  );
}
