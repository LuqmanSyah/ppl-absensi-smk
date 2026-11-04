"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { invalidForm, type FormState } from "@/lib/forms";
import { locationSchema } from "@/lib/validation/master-data";

function readForm(formData: FormData) {
  return {
    name: formData.get("name"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    radiusM: formData.get("radiusM"),
    isActive: formData.get("isActive"),
  };
}

const toDecimal = (n: number) => n.toFixed(7);

export async function createLocation(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const parsed = locationSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalidForm(parsed.error, formData);
  const data = parsed.data;

  // Hanya satu lokasi aktif: lokasi lain dinonaktifkan dalam transaksi yang sama.
  const location = await prisma.$transaction(async (tx) => {
    if (data.isActive) await tx.schoolLocation.updateMany({ data: { isActive: false } });
    return tx.schoolLocation.create({
      data: {
        name: data.name,
        latitude: toDecimal(data.latitude),
        longitude: toDecimal(data.longitude),
        radiusM: data.radiusM,
        isActive: data.isActive,
      },
    });
  });

  await logAudit({ userId: admin.id, action: "LOCATION_CREATE", entity: "school_locations", entityId: location.id, detail: data });

  revalidatePath("/admin", "layout");
  redirect("/admin/lokasi");
}

export async function updateLocation(locationId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const existing = await prisma.schoolLocation.findUnique({ where: { id: locationId } });
  if (!existing) return { message: "Lokasi tidak ditemukan." };

  const parsed = locationSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalidForm(parsed.error, formData);
  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (data.isActive) {
      await tx.schoolLocation.updateMany({ where: { NOT: { id: locationId } }, data: { isActive: false } });
    }
    await tx.schoolLocation.update({
      where: { id: locationId },
      data: {
        name: data.name,
        latitude: toDecimal(data.latitude),
        longitude: toDecimal(data.longitude),
        radiusM: data.radiusM,
        isActive: data.isActive,
      },
    });
  });

  await logAudit({
    userId: admin.id,
    action: "LOCATION_UPDATE",
    entity: "school_locations",
    entityId: locationId,
    detail: {
      before: {
        name: existing.name,
        latitude: existing.latitude.toString(),
        longitude: existing.longitude.toString(),
        radiusM: existing.radiusM,
        isActive: existing.isActive,
      },
      after: data,
    },
  });

  revalidatePath("/admin", "layout");
  redirect("/admin/lokasi");
}

export async function deleteLocation(locationId: number): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const existing = await prisma.schoolLocation.findUnique({ where: { id: locationId } });
  if (!existing) return { message: "Lokasi tidak ditemukan." };
  if (existing.isActive) {
    return { message: "Lokasi aktif tidak bisa dihapus. Aktifkan lokasi lain lebih dulu." };
  }

  await prisma.schoolLocation.delete({ where: { id: locationId } });
  await logAudit({
    userId: admin.id,
    action: "LOCATION_DELETE",
    entity: "school_locations",
    entityId: locationId,
    detail: { name: existing.name, latitude: existing.latitude.toString(), longitude: existing.longitude.toString() },
  });

  revalidatePath("/admin", "layout");
  redirect("/admin/lokasi");
}
