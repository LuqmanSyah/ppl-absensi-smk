import Link from "next/link";
import { LiveBadge } from "@/components/attendance/status-badge";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { formatDate, formatTime } from "@/lib/time";
import { isSessionOpen } from "@/lib/attendance/server";

export default async function TeacherSessionsPage() {
  const user = await requireRole("TEACHER");
  const sessions = await prisma.attendanceSession.findMany({
    where: { teacher: { userId: user.id } },
    orderBy: { openedAt: "desc" },
    take: 50,
    include: { schedule: true, _count: { select: { attendances: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Riwayat sesi</h1>
      {sessions.length === 0 && <p className="text-sm text-muted-foreground">Belum pernah membuka sesi absensi.</p>}
      <ul className="flex flex-col gap-2">
        {sessions.map((s) => (
          <li key={s.id}>
            <Link href={`/guru/sesi/${s.id}`} className="flex flex-col gap-1 surface p-4 hover:bg-muted/50">
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {s.schedule.subject} · {s.schedule.className}
                {isSessionOpen(s) && <LiveBadge />}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatDate(s.openedAt, config.timezone)}, {formatTime(s.openedAt, config.timezone)} · {s._count.attendances} siswa absen
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
