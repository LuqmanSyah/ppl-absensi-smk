import { AttendanceBadge } from "@/components/attendance/status-badge";
import { LEAVE_TYPE_LABEL, LeaveStatusBadge, formatLeaveRange } from "@/components/attendance/leave-badge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { selectClassName } from "@/lib/styles";
import { formatDate, formatTime, zonedToUtc } from "@/lib/time";
import { schoolNow } from "@/lib/attendance/server";

/** Daftar 6 bulan terakhir dalam format "YYYY-MM". */
function recentMonths(today: string) {
  const [y, m] = today.split("-").map(Number);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    return d.toISOString().slice(0, 7);
  });
}

const monthLabel = (ym: string) =>
  new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));

export default async function StudentHistoryPage({ searchParams }: PageProps<"/siswa/riwayat">) {
  const user = await requireRole("STUDENT");
  const months = recentMonths(schoolNow().date);
  const { bulan } = await searchParams;
  const month = typeof bulan === "string" && months.includes(bulan) ? bulan : months[0];
  const tz = config.timezone;

  const [y, m] = month.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  const from = zonedToUtc(`${month}-01`, "00:00", tz);
  const to = zonedToUtc(nextMonth, "00:00", tz);

  const [attendances, leaves] = await Promise.all([
    prisma.attendance.findMany({
      where: { student: { userId: user.id }, checkInAt: { gte: from, lt: to } },
      orderBy: { checkInAt: "desc" },
      include: { session: { include: { schedule: true } } },
    }),
    prisma.leaveRequest.findMany({
      where: {
        student: { userId: user.id },
        dateFrom: { lt: new Date(`${nextMonth}T00:00:00Z`) },
        dateTo: { gte: new Date(`${month}-01T00:00:00Z`) },
      },
      orderBy: { dateFrom: "desc" },
    }),
  ]);

  const hadir = attendances.filter((a) => a.status === "HADIR").length;
  const terlambat = attendances.length - hadir;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Riwayat kehadiran</h1>
      <form method="get" className="flex gap-2">
        <select name="bulan" defaultValue={month} aria-label="Bulan" className={selectClassName}>
          {months.map((ym) => (
            <option key={ym} value={ym}>
              {monthLabel(ym)}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonVariants({ variant: "outline" })}>
          Tampilkan
        </button>
      </form>

      <p className="text-sm" data-testid="history-summary">
        {monthLabel(month)}: <strong>{hadir}</strong> hadir, <strong>{terlambat}</strong> terlambat, <strong>{leaves.filter((l) => l.status === "APPROVED").length}</strong> izin/sakit disetujui.
      </p>

      <section className="flex flex-col gap-2">
        {attendances.length === 0 && <p className="text-sm text-muted-foreground">Belum ada catatan kehadiran di bulan ini.</p>}
        <ul className="flex flex-col gap-2">
          {attendances.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 surface p-3 text-sm">
              <div>
                <p className="font-medium">{a.session.schedule.subject}</p>
                <p className="text-muted-foreground">
                  {formatDate(a.checkInAt!, tz, { weekday: "short", month: "short" })} · Masuk {formatTime(a.checkInAt!, tz)}
                  {a.checkOutAt ? ` · Selesai ${formatTime(a.checkOutAt, tz)}` : ""}
                </p>
              </div>
              <AttendanceBadge status={a.status} />
            </li>
          ))}
        </ul>
      </section>

      {leaves.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">Izin / sakit</h2>
          <ul className="flex flex-col gap-2">
            {leaves.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 surface p-3 text-sm">
                <span>
                  {LEAVE_TYPE_LABEL[l.type]} · {formatLeaveRange(l.dateFrom, l.dateTo)}
                </span>
                <LeaveStatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
