import { notFound } from "next/navigation";
import { BackLink } from "@/components/data-list";
import { AutoRefresh } from "@/components/attendance/auto-refresh";
import { RosterView } from "@/components/attendance/roster-view";
import { PageHeader } from "@/components/page-header";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { parseId } from "@/lib/params";
import { dateToTime } from "@/lib/schedule-time";
import { formatDate, formatTime } from "@/lib/time";
import { isSessionOpen, lessonTimes } from "@/lib/attendance/server";
import { getSessionRoster } from "@/lib/attendance/roster";

/** Admin melihat daftar hadir sesi mana pun (tanpa QR Code). */
export default async function AdminSessionPage({ params }: PageProps<"/admin/sesi/[id]">) {
  await requireRole("ADMIN");
  const id = parseId((await params).id);
  if (!id) notFound();

  const session = await prisma.attendanceSession.findUnique({
    where: { id },
    include: { schedule: true, teacher: { select: { name: true } } },
  });
  if (!session) notFound();

  const open = isSessionOpen(session);
  const roster = await getSessionRoster(session);
  const tz = config.timezone;

  return (
    <>
      {open && <AutoRefresh seconds={10} />}
      <BackLink href="/admin" label="Dashboard" />
      <PageHeader
        title={`${session.schedule.subject} · ${session.schedule.className}`}
        description={`${session.teacher.name} · ${formatDate(session.openedAt, tz)} · ${dateToTime(session.schedule.startTime)}-${dateToTime(session.schedule.endTime)} · dibuka ${formatTime(session.openedAt, tz)} · ${open ? "aktif" : "berakhir"}`}
      />
      <RosterView {...roster} open={open} className={session.schedule.className} checkoutOpensAt={lessonTimes(session).opensAt} />
    </>
  );
}
