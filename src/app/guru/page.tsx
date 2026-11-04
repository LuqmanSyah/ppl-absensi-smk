import Link from "next/link";
import { ConfirmActionButton } from "@/components/form/confirm-button";
import { AutoRefresh } from "@/components/attendance/auto-refresh";
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
      <div>
        <h1 className="text-xl font-semibold">Halo, {user.name}</h1>
        <p className="text-sm text-muted-foreground">{formatDate(now.now, config.timezone)}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Jadwal hari ini</h2>
        {today.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada jadwal mengajar hari ini.</p>}
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
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {s.subject} · {s.className}
                  {open && <Badge>Sesi aktif</Badge>}
                  {session && !open && <Badge variant="secondary">Sesi selesai</Badge>}
                </CardTitle>
                <CardDescription>
                  {startTime}-{endTime}
                </CardDescription>
              </CardHeader>
              {session && statsBySession.get(session.id) && (
                <CardContent className="text-sm" data-testid="session-stats">
                  {(() => {
                    const st = statsBySession.get(session.id)!;
                    return (
                      <>
                        <span className="tabular-nums">
                          {st.hadir + st.terlambat}/{st.totalStudents} hadir
                          {st.terlambat > 0 && ` (${st.terlambat} terlambat)`}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          · {st.sudahSelesai}/{st.hadir + st.terlambat} absen selesai
                        </span>
                        {st.tidakSelesai > 0 && <span className="ml-2 font-medium text-destructive">{st.tidakSelesai} tidak absen selesai</span>}
                      </>
                    );
                  })()}
                </CardContent>
              )}
              <CardContent className="flex flex-wrap gap-2">
                {open ? (
                  <Link href={`/guru/sesi/${session.id}`} className={buttonVariants()}>
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
        <h2 className="font-medium">Jadwal mengajar minggu ini</h2>
        {schedules.length === 0 && <p className="text-sm text-muted-foreground">Belum ada jadwal. Hubungi Admin TU.</p>}
        <ul className="divide-y rounded-xl border text-sm">
          {schedules.map((s) => (
            <li key={s.id} className="flex flex-wrap justify-between gap-2 px-4 py-2">
              <span>
                <span className="font-medium">{DAY_LABELS[s.day]}</span> {dateToTime(s.startTime)}-{dateToTime(s.endTime)}
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
