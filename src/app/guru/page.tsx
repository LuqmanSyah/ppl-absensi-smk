import Link from "next/link";
import { QrCode } from "lucide-react";
import { ConfirmActionButton } from "@/components/form/confirm-button";
import { AutoRefresh } from "@/components/attendance/auto-refresh";
import { LiveBadge } from "@/components/attendance/status-badge";
import { ProgressBar } from "@/components/attendance/today-overview";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { DAY_LABELS, dateToTime } from "@/lib/schedule-time";
import { formatDate, hhmmToMinutes } from "@/lib/time";
import { sessionWindow } from "@/lib/attendance/rules";
import { isSessionOpen, schoolNow, todayRange } from "@/lib/attendance/server";
import { getTodayOverview } from "@/lib/attendance/dashboard";
import { openSession } from "./actions";

export default async function TeacherHomePage() {
  const user = await requireRole("TEACHER");
  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { userId: user.id }, select: { id: true } });
  const now = schoolNow();
  const { start, end } = todayRange();

  const schedules = await prisma.schedule.findMany({
    where: { teacherId: teacher.id },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
    include: {
      sessions: { where: { openedAt: { gte: start, lt: end } }, orderBy: { openedAt: "desc" }, take: 1 },
    },
  });
  const today = schedules.filter((s) => s.day === now.weekday);
  const overview = await getTodayOverview({ teacherId: teacher.id });
  const statsBySession = new Map(overview.sessions.map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-6">
      {overview.totals.activeSessions > 0 && <AutoRefresh seconds={10} />}
      <section className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20">
        <div className="bg-dots pointer-events-none absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute -top-16 -right-12 size-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative">
          <p className="text-sm text-primary-foreground/75">{formatDate(now.now, config.timezone)}</p>
          <h1 className="mt-1 text-2xl font-bold">Halo, {user.name}</h1>
          <p className="mt-0.5 text-sm text-primary-foreground/80">
            {today.length === 0 ? "Tidak ada jadwal mengajar hari ini." : `${today.length} jadwal mengajar hari ini`}
            {overview.totals.activeSessions > 0 && ` · ${overview.totals.activeSessions} sesi aktif`}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Jadwal hari ini</h2>
        {today.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Tidak ada jadwal mengajar hari ini.</p>
        )}
        {today.map((s) => {
          const startTime = dateToTime(s.startTime);
          const endTime = dateToTime(s.endTime);
          const session = s.sessions[0];
          const open = session && isSessionOpen(session, now.now);
          const window = sessionWindow(
            { day: s.day, startMinutes: hhmmToMinutes(startTime), endMinutes: hhmmToMinutes(endTime) },
            now,
            config.openSessionEarlyMinutes,
          );
          return (
            <Card key={s.id} className={open ? "ring-2 ring-primary/40" : undefined}>
              <CardHeader className="grid-cols-[auto_1fr] gap-x-3">
                <div className="row-span-2 flex w-14 flex-col items-center justify-center rounded-lg bg-muted py-1.5 text-xs leading-tight tabular-nums">
                  <span className="font-semibold">{startTime}</span>
                  <span className="text-muted-foreground">{endTime}</span>
                </div>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {s.subject} · {s.className}
                  {open && <LiveBadge label="Sesi aktif" />}
                  {session && !open && <Badge variant="secondary">Sesi selesai</Badge>}
                </CardTitle>
                <CardDescription>{hhmmToMinutes(endTime) - hhmmToMinutes(startTime)} menit pelajaran</CardDescription>
              </CardHeader>
              {session && statsBySession.get(session.id) && (
                <CardContent className="text-sm" data-testid="session-stats">
                  {(() => {
                    const st = statsBySession.get(session.id)!;
                    const present = st.hadir + st.terlambat;
                    return (
                      <div className="flex flex-col gap-2 rounded-lg bg-muted/60 p-3">
                        <div>
                          <span className="font-semibold tabular-nums">
                            {present}/{st.totalStudents} hadir
                          </span>
                          {st.terlambat > 0 && <span className="text-[color-mix(in_oklch,var(--warning),black_18%)] dark:text-warning">{` (${st.terlambat} terlambat)`}</span>}
                          <span className="ml-2 text-muted-foreground">
                            · {st.sudahSelesai}/{present} absen selesai
                          </span>
                          {st.tidakSelesai > 0 && <span className="ml-2 font-medium text-destructive">{st.tidakSelesai} tidak absen selesai</span>}
                        </div>
                        <ProgressBar value={st.totalStudents ? Math.round((present / st.totalStudents) * 100) : 0} className="bg-background" />
                      </div>
                    );
                  })()}
                </CardContent>
              )}
              <CardContent className="flex flex-wrap gap-2">
                {open ? (
                  <Link href={`/guru/sesi/${session.id}`} className={buttonVariants()}>
                    <QrCode aria-hidden />
                    Tampilkan QR dan daftar hadir
                  </Link>
                ) : window.ok ? (
                  <ConfirmActionButton action={openSession.bind(null, s.id)} label={session ? "Buka sesi lagi" : "Buka sesi absensi"} variant="default" />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {window.reason === "TOO_EARLY"
                      ? `Sesi bisa dibuka mulai pukul ${String(Math.floor(window.opensAtMinutes! / 60)).padStart(2, "0")}:${String(window.opensAtMinutes! % 60).padStart(2, "0")}.`
                      : "Jam pelajaran sudah selesai."}
                  </p>
                )}
                {session && !open && (
                  <Link href={`/guru/sesi/${session.id}`} className={buttonVariants({ variant: "outline" })}>
                    Lihat daftar hadir
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Jadwal mengajar minggu ini</h2>
        {schedules.length === 0 && <p className="text-sm text-muted-foreground">Belum ada jadwal. Hubungi Admin TU.</p>}
        <ul className="surface divide-y text-sm">
          {schedules.map((s) => (
            <li
              key={s.id}
              className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 ${s.day === now.weekday ? "bg-accent/40" : ""}`}
            >
              <span className="tabular-nums">
                <span className="inline-block w-16 font-semibold">{DAY_LABELS[s.day]}</span> {dateToTime(s.startTime)}-{dateToTime(s.endTime)}
              </span>
              <span className="text-muted-foreground">
                {s.subject} · {s.className}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
