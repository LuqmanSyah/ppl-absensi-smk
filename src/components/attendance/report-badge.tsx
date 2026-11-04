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

const REPORT_VARIANT = {
  HADIR: "success",
  TERLAMBAT: "warning",
  IZIN: "info",
  SAKIT: "info",
  ALPA: "destructive",
  BELUM: "outline",
} as const satisfies Record<ReportStatus, string>;

export function ReportBadge({ status }: { status: ReportStatus }) {
  return <Badge variant={REPORT_VARIANT[status]}>{REPORT_LABEL[status]}</Badge>;
}
