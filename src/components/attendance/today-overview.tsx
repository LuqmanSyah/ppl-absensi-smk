import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { config } from "@/lib/config";
import { formatTime } from "@/lib/time";
import type { SessionOverview } from "@/lib/attendance/dashboard";

/** Kotak angka ringkasan. */
export function StatTile({ label, value, tone }: { label: string; value: number; tone?: "danger" }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === "danger" && value > 0 ? "border-destructive/50 bg-destructive/5" : ""}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${tone === "danger" && value > 0 ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}

export function SessionsTable({ sessions, hrefFor }: { sessions: SessionOverview[]; hrefFor: (id: number) => string }) {
  const tz = config.timezone;
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pelajaran</TableHead>
            <TableHead>Guru</TableHead>
            <TableHead>Dibuka</TableHead>
            <TableHead>Kehadiran</TableHead>
            <TableHead>Absen selesai</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                Belum ada sesi absensi hari ini.
              </TableCell>
            </TableRow>
          )}
          {sessions.map((s) => {
            const present = s.hadir + s.terlambat;
            const pct = s.totalStudents ? Math.round((present / s.totalStudents) * 100) : 0;
            return (
              <TableRow key={s.id}>
                <TableCell>
                  <Link href={hrefFor(s.id)} className="font-medium underline-offset-4 hover:underline">
                    {s.subject} · {s.className}
                  </Link>
                  <span className="ml-2">{s.open ? <Badge>Aktif</Badge> : <Badge variant="secondary">Selesai</Badge>}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{s.teacherName}</TableCell>
                <TableCell className="tabular-nums">{formatTime(s.openedAt, tz)}</TableCell>
                <TableCell>
                  <div className="flex min-w-36 flex-col gap-1">
                    <span className="tabular-nums">
                      {present}/{s.totalStudents} hadir{s.terlambat > 0 && ` (${s.terlambat} terlambat)`}
                    </span>
                    <div className="h-1.5 w-full rounded-full bg-muted" aria-hidden>
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <span className="block tabular-nums">
                    {s.sudahSelesai}/{present}
                  </span>
                  {s.tidakSelesai > 0 && <span className="block font-medium text-destructive">{s.tidakSelesai} tidak absen selesai</span>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

