import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { AttendanceBadge } from "@/components/attendance/status-badge";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { config } from "@/lib/config";
import { formatTime } from "@/lib/time";
import type { getSessionRoster } from "@/lib/attendance/roster";

type Roster = Awaited<ReturnType<typeof getSessionRoster>>;

/** Ringkasan dan tabel daftar hadir satu sesi (FR-13). Dipakai guru dan admin. */
export function RosterView({
  rows,
  summary,
  open,
  className,
  checkoutOpensAt,
}: Roster & { open: boolean; className: string; checkoutOpensAt: Date }) {
  const tz = config.timezone;
  const present = summary.hadir + summary.terlambat;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm" aria-label="Ringkasan kehadiran" data-testid="roster-summary">
        <SummaryChip dot="bg-success">Hadir: <strong>{summary.hadir}</strong></SummaryChip>
        <SummaryChip dot="bg-warning">Terlambat: <strong>{summary.terlambat}</strong></SummaryChip>
        <SummaryChip dot="bg-info">Izin/Sakit: <strong>{summary.izin}</strong></SummaryChip>
        <SummaryChip dot={open ? "bg-muted-foreground/50" : "bg-destructive"}>
          {open ? "Belum absen" : "Tidak hadir"}: <strong>{summary.belum}</strong>
        </SummaryChip>
        <SummaryChip dot="bg-primary">Absen selesai: <strong>{summary.sudahSelesai}/{present}</strong></SummaryChip>
        <span className="px-1 text-muted-foreground">dari {summary.total} siswa</span>
      </div>
      {summary.tidakSelesai > 0 && (
        <p
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          data-testid="checkout-alert"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <strong>{summary.tidakSelesai}</strong> siswa hadir tetapi tidak absen selesai. Kemungkinan meninggalkan kelas sebelum
            pelajaran berakhir.
          </span>
        </p>
      )}
      {open && (
        <p className="text-xs text-muted-foreground">
          Absen selesai dibuka pukul {formatTime(checkoutOpensAt, tz)}. Daftar diperbarui otomatis setiap 10 detik.
        </p>
      )}
      <div className="surface overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Masuk</TableHead>
              <TableHead>Selesai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Belum ada siswa aktif di kelas {className}.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.studentId}>
                <TableCell>
                  <span className="font-semibold">{r.name}</span>
                  <span className="block font-mono text-xs text-muted-foreground">{r.nis}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <AttendanceBadge status={r.status} ended={!open} />
                    {r.checkoutMissing && <Badge variant="destructive">Tidak absen selesai</Badge>}
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">{r.checkInAt ? formatTime(r.checkInAt, tz) : "-"}</TableCell>
                <TableCell className="tabular-nums">{r.checkOutAt ? formatTime(r.checkOutAt, tz) : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function SummaryChip({ dot, children }: { dot: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 shadow-xs">
      <span className={`size-2 rounded-full ${dot}`} aria-hidden />
      <span>{children}</span>
    </span>
  );
}
