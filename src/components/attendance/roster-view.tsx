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
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Ringkasan kehadiran" data-testid="roster-summary">
        <span>Hadir: <strong>{summary.hadir}</strong></span>
        <span>Terlambat: <strong>{summary.terlambat}</strong></span>
        <span>Izin/Sakit: <strong>{summary.izin}</strong></span>
        <span>{open ? "Belum absen" : "Tidak hadir"}: <strong>{summary.belum}</strong></span>
        <span>Absen selesai: <strong>{summary.sudahSelesai}/{present}</strong></span>
        <span className="text-muted-foreground">dari {summary.total} siswa</span>
      </div>
      {summary.tidakSelesai > 0 && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm" data-testid="checkout-alert">
          <strong>{summary.tidakSelesai}</strong> siswa hadir tetapi tidak absen selesai. Kemungkinan meninggalkan kelas sebelum
          pelajaran berakhir.
        </p>
      )}
      {open && (
        <p className="text-xs text-muted-foreground">
          Absen selesai dibuka pukul {formatTime(checkoutOpensAt, tz)}. Daftar diperbarui otomatis setiap 10 detik.
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border">
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
                  <span className="font-medium">{r.name}</span>
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
