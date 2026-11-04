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
    ["Hadir", c.HADIR, "text-success"],
    ["Terlambat", c.TERLAMBAT, "text-[color-mix(in_oklch,var(--warning),black_18%)] dark:text-warning"],
    ["Izin", c.IZIN, "text-info"],
    ["Sakit", c.SAKIT, "text-info"],
    ["Alpa", c.ALPA, "text-destructive"],
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" data-testid="student-summary">
        <div className="surface col-span-3 flex items-center justify-between gap-3 border-primary/20 bg-accent/40 p-4 sm:order-last sm:col-span-1 sm:flex-col sm:items-start sm:justify-start sm:gap-0 sm:p-3">
          <p className="text-xs font-medium text-accent-foreground">Kehadiran</p>
          <p className="text-2xl font-bold text-primary tabular-nums">{c.percent === null ? "-" : `${c.percent}%`}</p>
        </div>
        {summary.map(([label, value, color]) => (
          <div key={label} className="surface p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold tabular-nums ${value > 0 ? color : ""}`}>{value}</p>
          </div>
        ))}
      </div>
      {c.tidakSelesai > 0 && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" data-testid="checkout-missing-note">
          {c.tidakSelesai} kali hadir tetapi tidak absen selesai.
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Riwayat per pelajaran</h2>
        {report.items.length === 0 && <p className="text-sm text-muted-foreground">Belum ada sesi absensi pada periode ini.</p>}
        <ul className="flex flex-col gap-2">
          {report.items.map((item) => (
            <li key={item.sessionId} className="flex flex-wrap items-center justify-between gap-2 surface p-3 text-sm">
              <div>
                <p className="font-semibold">{item.subject}</p>
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
          <h2 className="font-semibold">Pengajuan izin / sakit</h2>
          <ul className="flex flex-col gap-2">
            {report.leaves.map((l) => (
              <li key={l.id} className="flex flex-col gap-1 surface p-3 text-sm">
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
