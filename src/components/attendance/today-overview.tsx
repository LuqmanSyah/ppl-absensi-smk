import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { LiveBadge } from "@/components/attendance/status-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { config } from "@/lib/config";
import { formatTime } from "@/lib/time";
import type { SessionOverview } from "@/lib/attendance/dashboard";

export type Tone = "primary" | "success" | "warning" | "danger" | "info" | "neutral";

export const TONE_CHIP: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-[color-mix(in_oklch,var(--warning),black_18%)] dark:text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  neutral: "bg-muted text-muted-foreground",
};

/** Kotak angka ringkasan. Nada "danger" hanya menyala jika nilainya lebih dari nol. */
export function StatTile({ label, value, tone = "neutral", icon: Icon }: { label: string; value: number; tone?: Tone; icon?: LucideIcon }) {
  const alert = tone === "danger" && value > 0;
  return (
    <div className={cn("surface flex items-start justify-between gap-3 p-4", alert && "border-destructive/40 bg-destructive/5")}>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-3xl font-bold tabular-nums", alert && "text-destructive")}>{value}</p>
      </div>
      {Icon && (
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONE_CHIP[tone === "danger" && !alert ? "neutral" : tone])}>
          <Icon className="size-[1.1rem]" aria-hidden />
        </span>
      )}
    </div>
  );
}

export function SessionsTable({ sessions, hrefFor }: { sessions: SessionOverview[]; hrefFor: (id: number) => string }) {
  const tz = config.timezone;
  return (
    <div className="surface overflow-x-auto">
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
                  <div className="flex items-center gap-2">
                    <Link href={hrefFor(s.id)} className="font-semibold underline-offset-4 hover:text-primary hover:underline">
                      {s.subject} · {s.className}
                    </Link>
                    {s.open ? <LiveBadge /> : <Badge variant="secondary">Selesai</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{s.teacherName}</TableCell>
                <TableCell className="tabular-nums">{formatTime(s.openedAt, tz)}</TableCell>
                <TableCell>
                  <div className="flex min-w-36 flex-col gap-1">
                    <span className="tabular-nums">
                      {present}/{s.totalStudents} hadir{s.terlambat > 0 && ` (${s.terlambat} terlambat)`}
                    </span>
                    <ProgressBar value={pct} />
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


/** Batang persentase kehadiran. */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)} aria-hidden>
      <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${value}%` }} />
    </div>
  );
}
