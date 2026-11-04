import { Badge } from "@/components/ui/badge";
import type { LeaveStatus } from "@/generated/prisma/enums";

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  if (status === "APPROVED") return <Badge>Disetujui</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive">Ditolak</Badge>;
  return <Badge variant="outline">Menunggu</Badge>;
}

export const LEAVE_TYPE_LABEL = { IZIN: "Izin", SAKIT: "Sakit" } as const;

/** Rentang tanggal @db.Date (UTC tengah malam) sebagai teks, misalnya "3 Nov 2026" atau "3-5 Nov 2026". */
export function formatLeaveRange(from: Date, to: Date) {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", ...opts }).format(d);
  const full = { day: "numeric", month: "short", year: "numeric" } as const;
  if (from.getTime() === to.getTime()) return fmt(from, full);
  return `${fmt(from, full)} - ${fmt(to, full)}`;
}
