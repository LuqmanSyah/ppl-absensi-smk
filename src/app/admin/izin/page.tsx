import Link from "next/link";
import type { LeaveStatus } from "@/generated/prisma/enums";
import { PageHeader } from "@/components/page-header";
import { EmptyRow } from "@/components/data-list";
import { ConfirmActionButton } from "@/components/form/confirm-button";
import { LEAVE_TYPE_LABEL, LeaveStatusBadge, formatLeaveRange } from "@/components/attendance/leave-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/time";
import { reviewLeave } from "./actions";

const TABS: { value: LeaveStatus; label: string }[] = [
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
];

export default async function AdminLeavePage({ searchParams }: PageProps<"/admin/izin">) {
  await requireRole("ADMIN");
  const { status } = await searchParams;
  const current = TABS.find((t) => t.value === status)?.value ?? "PENDING";

  const [leaves, pendingCount] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { status: current },
      orderBy: current === "PENDING" ? { createdAt: "asc" } : { reviewedAt: "desc" },
      take: 200,
      include: { student: { select: { name: true, nis: true, className: true } } },
    }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <>
      <PageHeader title="Izin dan Sakit" description="Konfirmasi pengajuan izin/sakit dari siswa." />
      <nav className="mb-4 flex gap-1" aria-label="Filter status">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/izin?status=${t.value}`}
            aria-current={t.value === current ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              t.value === current ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t.label}
            {t.value === "PENDING" && pendingCount > 0 && ` (${pendingCount})`}
          </Link>
        ))}
      </nav>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Siswa</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Alasan</TableHead>
              <TableHead>{current === "PENDING" ? "Aksi" : "Status"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.length === 0 && <EmptyRow colSpan={5}>Tidak ada pengajuan.</EmptyRow>}
            {leaves.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <span className="font-medium">{l.student.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {l.student.nis} · {l.student.className}
                  </span>
                </TableCell>
                <TableCell>{LEAVE_TYPE_LABEL[l.type]}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatLeaveRange(l.dateFrom, l.dateTo)}
                  <span className="block text-xs text-muted-foreground">
                    diajukan {formatDate(l.createdAt, config.timezone, { weekday: undefined, month: "short", year: undefined })}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs whitespace-normal">{l.reason}</TableCell>
                <TableCell>
                  {current === "PENDING" ? (
                    <div className="flex flex-col gap-2">
                      <ConfirmActionButton action={reviewLeave.bind(null, l.id, "APPROVED")} label="Setujui" variant="default" />
                      <ConfirmActionButton
                        action={reviewLeave.bind(null, l.id, "REJECTED")}
                        label="Tolak"
                        confirmLabel="Tolak pengajuan ini?"
                        variant="outline"
                      />
                    </div>
                  ) : (
                    <LeaveStatusBadge status={l.status} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
