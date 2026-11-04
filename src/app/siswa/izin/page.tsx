import { ActionForm } from "@/components/form/action-form";
import { SelectField, TextField } from "@/components/form/fields";
import { ConfirmActionButton } from "@/components/form/confirm-button";
import { LEAVE_TYPE_LABEL, LeaveStatusBadge, formatLeaveRange } from "@/components/attendance/leave-badge";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { schoolNow } from "@/lib/attendance/server";
import { cancelLeaveRequest, createLeaveRequest } from "./actions";
import { ReasonField } from "./reason-field";

export default async function StudentLeavePage() {
  const user = await requireRole("STUDENT");
  const today = schoolNow().date;
  const leaves = await prisma.leaveRequest.findMany({
    where: { student: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Izin / Sakit</h1>
        <p className="text-sm text-muted-foreground">Pengajuan dikonfirmasi oleh Admin TU.</p>
      </div>

      <ActionForm action={createLeaveRequest} submitLabel="Kirim pengajuan" className="flex flex-col gap-4 surface p-4">
        <SelectField
          name="type"
          label="Jenis"
          placeholder="Pilih jenis"
          options={[
            { value: "SAKIT", label: "Sakit" },
            { value: "IZIN", label: "Izin" },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField name="dateFrom" label="Dari tanggal" type="date" defaultValue={today} required />
          <TextField name="dateTo" label="Sampai tanggal" type="date" defaultValue={today} required />
        </div>
        <ReasonField />
      </ActionForm>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Pengajuan saya</h2>
        {leaves.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pengajuan.</p>}
        <ul className="flex flex-col gap-2">
          {leaves.map((l) => (
            <li key={l.id} className="flex flex-col gap-2 surface p-4 text-sm" data-testid="leave-item">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {LEAVE_TYPE_LABEL[l.type]} · {formatLeaveRange(l.dateFrom, l.dateTo)}
                </span>
                <LeaveStatusBadge status={l.status} />
              </div>
              <p className="text-muted-foreground">{l.reason}</p>
              {l.status === "PENDING" && (
                <ConfirmActionButton action={cancelLeaveRequest.bind(null, l.id)} label="Batalkan" confirmLabel="Batalkan pengajuan ini?" />
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
