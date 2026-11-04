import Link from "next/link";
import { QrCode } from "lucide-react";
import { AttendanceBadge, LiveBadge } from "@/components/attendance/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/dal";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { dateToTime } from "@/lib/schedule-time";
import { formatDate, formatTime } from "@/lib/time";
import { isSessionOpen, lessonTimes, schoolNow, todayRange } from "@/lib/attendance/server";

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
      <section className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20">
        <div className="bg-dots pointer-events-none absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute -top-16 -right-12 size-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-4">
          <div>
            <p className="text-sm text-primary-foreground/75">{formatDate(now.now, tz)}</p>
            <h1 className="mt-1 text-2xl font-bold">Halo, {user.name}</h1>
            <p className="mt-0.5 text-sm text-primary-foreground/80">Kelas {student.className}</p>
          </div>
          <Link
            href="/siswa/absen"
            className={cn(buttonVariants({ size: "lg" }), "h-14 bg-white text-base text-primary shadow-md hover:bg-white/90")}
          >
            <QrCode aria-hidden className="size-5" />
            Scan QR untuk absen
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Pelajaran hari ini</h2>
        {schedules.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Tidak ada jadwal pelajaran hari ini.</p>
        )}
        {schedules.map((s) => {
          const session = s.sessions[0];
          const attendance = session?.attendances[0];
          const open = session ? isSessionOpen(session, now.now) : false;
          return (
            <Card key={s.id} size="sm" className={open && !attendance ? "ring-2 ring-primary/40" : undefined}>
              <CardHeader className="grid-cols-[auto_1fr] gap-x-3">
                <div className="row-span-2 flex w-14 flex-col items-center justify-center rounded-lg bg-muted py-1.5 text-xs leading-tight tabular-nums">
                  <span className="font-semibold">{dateToTime(s.startTime)}</span>
                  <span className="text-muted-foreground">{dateToTime(s.endTime)}</span>
                </div>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                  {s.subject}
                  {attendance ? (
                    <AttendanceBadge status={attendance.status} />
                  ) : open ? (
                    <LiveBadge label="Sesi dibuka, silakan absen" />
                  ) : session ? (
                    <AttendanceBadge status="BELUM" ended />
                  ) : null}
                </CardTitle>
                <CardDescription>{s.teacher.name}</CardDescription>
              </CardHeader>
              {attendance && (
                <CardContent className="text-sm text-muted-foreground" data-testid="lesson-checkout">
                  <p className="rounded-lg bg-muted/60 px-3 py-2">
                    Masuk {formatTime(attendance.checkInAt!, tz)}
                    {attendance.checkOutAt
                      ? ` · Selesai ${formatTime(attendance.checkOutAt, tz)}`
                      : open
                        ? ` · Absen selesai mulai ${formatTime(lessonTimes({ openedAt: session.openedAt, schedule: s }).opensAt, tz)}`
                        : " · Tidak absen selesai"}
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </section>
    </div>
  );
}
