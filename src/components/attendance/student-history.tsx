import { ReportBadge } from "@/components/attendance/report-badge";
import { Badge } from "@/components/ui/badge";
import { LEAVE_TYPE_LABEL, LeaveStatusBadge, formatLeaveRange } from "@/components/attendance/leave-badge";
import { config } from "@/lib/config";
import { formatDate, formatTime } from "@/lib/time";
import type { getStudentReport } from "@/lib/attendance/report";

type Report = NonNullable<Awaited<ReturnType<typeof getStudentReport>>>;

/** Ringkasan dan riwayat kehadiran satu siswa. Dipakai orang tua dan admin. */
export function StudentHistory({ report }: { report: Report }) {
  const tz = config.timezone;
  const c = report.counts;
  const summary = [
    ["Hadir", c.HADIR],
    ["Terlambat", c.TERLAMBAT],
    ["Izin", c.IZIN],
    ["Sakit", c.SAKIT],
    ["Alpa", c.ALPA],
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" data-testid="student-summary">
        {summary.map(([label, value]) => (
          <div key={label} className="rounded-xl border p-3 text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
        <div className="rounded-xl border p-3 text-center">
          <p className="text-xs text-muted-foreground">Kehadiran</p>
          <p className="text-xl font-semibold tabular-nums">{c.percent === null ? "-" : `${c.percent}%`}</p>
        </div>
      </div>
      {c.tidakSelesai > 0 && (
        <p className="text-sm text-destructive" data-testid="checkout-missing-note">
          {c.tidakSelesai} kali hadir tetapi tidak absen selesai.
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Riwayat per pelajaran</h2>
        {report.items.length === 0 && <p className="text-sm text-muted-foreground">Belum ada sesi absensi pada periode ini.</p>}
        <ul className="flex flex-col gap-2">
          {report.items.map((item) => (
            <li key={item.sessionId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
              <div>
                <p className="font-medium">{item.subject}</p>
                <p className="text-muted-foreground">
                  {formatDate(item.openedAt, tz, { weekday: "short", month: "short" })} · {item.teacherName}
                  {item.checkInAt && ` · masuk ${formatTime(item.checkInAt, tz)}`}
                  {item.checkOutAt && ` · selesai ${formatTime(item.checkOutAt, tz)}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <ReportBadge status={item.status} />
                {item.checkoutMissing && <Badge variant="destructive">Tidak absen selesai</Badge>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {report.leaves.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-medium">Pengajuan izin / sakit</h2>
          <ul className="flex flex-col gap-2">
            {report.leaves.map((l) => (
              <li key={l.id} className="flex flex-col gap-1 rounded-xl border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {LEAVE_TYPE_LABEL[l.type]} · {formatLeaveRange(l.dateFrom, l.dateTo)}
                  </span>
                  <LeaveStatusBadge status={l.status} />
                </div>
                <p className="text-muted-foreground">{l.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
