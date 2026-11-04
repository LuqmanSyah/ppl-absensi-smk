import { Badge } from "@/components/ui/badge";
import type { ReportStatus } from "@/lib/attendance/report";

export const REPORT_LABEL: Record<ReportStatus, string> = {
  HADIR: "Hadir",
  TERLAMBAT: "Terlambat",
  IZIN: "Izin",
  SAKIT: "Sakit",
  ALPA: "Alpa",
  BELUM: "Sedang berlangsung",
};

export function ReportBadge({ status }: { status: ReportStatus }) {
  const variant =
    status === "HADIR" ? "default" : status === "ALPA" || status === "TERLAMBAT" ? "destructive" : status === "BELUM" ? "outline" : "secondary";
  return <Badge variant={variant}>{REPORT_LABEL[status]}</Badge>;
}
