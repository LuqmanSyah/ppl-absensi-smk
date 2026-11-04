"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import type { FormState } from "@/lib/forms";

/** FR-11: Admin TU menyetujui atau menolak pengajuan izin/sakit. */
export async function reviewLeave(leaveId: number, decision: "APPROVED" | "REJECTED"): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  // Hanya pengajuan yang masih menunggu yang bisa diproses (mencegah dua admin memproses bersamaan).
  const result = await prisma.leaveRequest.updateMany({
    where: { id: leaveId, status: "PENDING" },
    data: { status: decision, reviewedBy: admin.id, reviewedAt: new Date() },
  });
  if (result.count === 0) return { message: "Pengajuan sudah diproses atau dibatalkan." };

  await logAudit({
    userId: admin.id,
    action: decision === "APPROVED" ? "LEAVE_APPROVE" : "LEAVE_REJECT",
    entity: "leave_requests",
    entityId: leaveId,
  });
  revalidatePath("/admin", "layout");
  return { success: true, message: decision === "APPROVED" ? "Pengajuan disetujui." : "Pengajuan ditolak." };
}
