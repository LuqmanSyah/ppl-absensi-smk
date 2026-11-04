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

const VARIANT: Record<RosterStatus, "default" | "secondary" | "destructive" | "outline"> = {
  HADIR: "default",
  TERLAMBAT: "destructive",
  IZIN: "secondary",
  SAKIT: "secondary",
  MENUNGGU_IZIN: "outline",
  BELUM: "outline",
};

export function AttendanceBadge({ status, ended = false }: { status: RosterStatus; ended?: boolean }) {
  // Setelah sesi berakhir, "Belum absen" berarti tidak hadir tanpa keterangan (alpa).
  const label = status === "BELUM" && ended ? "Tidak hadir" : LABEL[status];
  return <Badge variant={status === "BELUM" && ended ? "destructive" : VARIANT[status]}>{label}</Badge>;
}
