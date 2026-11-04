import { Badge } from "@/components/ui/badge";
import type { RosterStatus } from "@/lib/attendance/roster";

const LABEL: Record<RosterStatus, string> = {
  HADIR: "Hadir",
  TERLAMBAT: "Terlambat",
  IZIN: "Izin",
  SAKIT: "Sakit",
  MENUNGGU_IZIN: "Izin menunggu",
  BELUM: "Belum absen",
};

const VARIANT: Record<RosterStatus, "success" | "warning" | "info" | "destructive" | "outline"> = {
  HADIR: "success",
  TERLAMBAT: "warning",
  IZIN: "info",
  SAKIT: "info",
  MENUNGGU_IZIN: "outline",
  BELUM: "outline",
};

export function AttendanceBadge({ status, ended = false }: { status: RosterStatus; ended?: boolean }) {
  // Setelah sesi berakhir, "Belum absen" berarti tidak hadir tanpa keterangan (alpa).
  const label = status === "BELUM" && ended ? "Tidak hadir" : LABEL[status];
  return <Badge variant={status === "BELUM" && ended ? "destructive" : VARIANT[status]}>{label}</Badge>;
}

/** Penanda sesi yang sedang berjalan, dengan titik berkedip. */
export function LiveBadge({ label = "Aktif" }: { label?: string }) {
  return (
    <Badge variant="success">
      <span className="relative flex size-1.5" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-success" />
      </span>
      {label}
    </Badge>
  );
}
