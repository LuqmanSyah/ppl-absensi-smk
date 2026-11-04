import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { BackLink } from "@/components/data-list";
import { AutoRefresh } from "@/components/attendance/auto-refresh";
import { RosterView } from "@/components/attendance/roster-view";
import { ConfirmActionButton } from "@/components/form/confirm-button";
import { LiveBadge } from "@/components/attendance/status-badge";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { parseId } from "@/lib/params";
import { dateToTime } from "@/lib/schedule-time";
import { formatDate, formatTime } from "@/lib/time";
import { buildAttendanceUrl } from "@/lib/attendance/rules";
import { getAppOrigin, isSessionOpen, lessonTimes } from "@/lib/attendance/server";
import { getSessionRoster } from "@/lib/attendance/roster";
import { closeSession } from "../../actions";

export default async function SessionPage({ params }: PageProps<"/guru/sesi/[id]">) {
  const user = await requireRole("TEACHER");
  const id = parseId((await params).id);
  if (!id) notFound();

  const session = await prisma.attendanceSession.findUnique({
    where: { id },
    include: { schedule: true, teacher: { select: { userId: true } } },
  });
  // Guru hanya bisa melihat sesinya sendiri.
  if (!session || session.teacher.userId !== user.id) notFound();

  const open = isSessionOpen(session);
  const times = lessonTimes(session);
  const [{ rows, summary }, origin] = await Promise.all([getSessionRoster(session), getAppOrigin()]);
  const qrUrl = buildAttendanceUrl(origin, session.qrToken);
  const qrImage = open ? await QRCode.toDataURL(qrUrl, { width: 640, margin: 1, errorCorrectionLevel: "M" }) : null;
  const tz = config.timezone;

  return (
    <div className="flex flex-col gap-6">
      {open && <AutoRefresh seconds={10} />}
      <div>
        <BackLink href="/guru" label="Beranda" />
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold">
          {session.schedule.subject} · {session.schedule.className}
          {open ? <LiveBadge /> : <Badge variant="secondary">Berakhir</Badge>}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(session.openedAt, tz)} · {dateToTime(session.schedule.startTime)}-{dateToTime(session.schedule.endTime)} · dibuka{" "}
          {formatTime(session.openedAt, tz)}
        </p>
      </div>

      {open && qrImage && (
        <section className="surface flex flex-col items-center gap-4 p-5">
          <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL hasil generate server */}
            <img src={qrImage} alt="QR Code absensi sesi ini" className="aspect-square w-full max-w-sm" data-testid="session-qr" />
          </div>
          <div className="grid w-full max-w-md grid-cols-2 gap-2 text-center text-sm">
            <div className="rounded-lg bg-success/10 p-2.5">
              <p className="text-xs text-muted-foreground">Absen masuk</p>
              <p className="font-semibold text-success tabular-nums">sampai {formatTime(times.end, tz)}</p>
            </div>
            <div className="rounded-lg bg-info/10 p-2.5">
              <p className="text-xs text-muted-foreground">Absen selesai</p>
              <p className="font-semibold text-info tabular-nums">
                {formatTime(times.opensAt, tz)}-{formatTime(times.closesAt, tz)}
              </p>
            </div>
          </div>
          <p className="max-w-md text-center text-sm text-muted-foreground">
            Minta siswa scan QR ini dari menu <strong>Absen</strong> untuk absen masuk (sampai {formatTime(times.end, tz)}). Siswa yang
            absen lebih dari {config.lateAfterMinutes} menit setelah sesi dibuka tercatat Terlambat. Tampilkan QR lagi mulai pukul{" "}
            <strong>{formatTime(times.opensAt, tz)}</strong> untuk <strong>absen selesai</strong> (sampai {formatTime(times.closesAt, tz)}).
          </p>
          <ConfirmActionButton
            action={closeSession.bind(null, session.id)}
            label="Tutup sesi"
            confirmLabel="Tutup sesi sekarang? Siswa tidak bisa absen lagi."
            variant="destructive"
          />
        </section>
      )}

      <RosterView rows={rows} summary={summary} open={open} className={session.schedule.className} checkoutOpensAt={times.opensAt} />
    </div>
  );
}
