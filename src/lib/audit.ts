// Pencatatan aktivitas pengguna (FR-18, NFR-07).
// Jangan pernah memasukkan password, hash, atau token ke `detail`.
import "server-only";
import { headers } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type AuditAction =
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGIN_BLOCKED"
  | "LOGOUT"
  | (string & {}); // aksi lain, misalnya STUDENT_CREATE

type AuditInput = {
  userId?: number | null;
  action: AuditAction;
  entity?: string;
  entityId?: number;
  detail?: Prisma.InputJsonValue;
};

async function getClientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

/** Menyimpan audit log. Kegagalan mencatat tidak boleh menggagalkan aksi utama. */
export async function logAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        detail: input.detail,
        ipAddress: await getClientIp(),
      },
    });
  } catch (error) {
    logger.error({ err: error, action: input.action }, "Gagal menyimpan audit log");
  }
}
