"use server";

// Impor siswa dari CSV (S1-11). Semua baris divalidasi lebih dulu; jika ada satu baris
// yang salah, tidak ada data yang disimpan (all-or-nothing).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { parseCsv } from "@/lib/csv";
import { fieldError, type FormState } from "@/lib/forms";
import { studentCreateSchema } from "@/lib/validation/master-data";

const MAX_ROWS = 1000;
const MAX_BYTES = 512 * 1024;
const MAX_ERRORS_SHOWN = 10;

const rowSchema = studentCreateSchema.pick({ nis: true, name: true, className: true });
const passwordSchema = studentCreateSchema.shape.password;

export async function importStudents(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return fieldError("password", password.error.issues[0].message, formData);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fieldError("file", "Pilih file CSV.", formData);
  if (file.size > MAX_BYTES) return fieldError("file", "Ukuran file maksimal 512 KB.", formData);

  const rows = parseCsv(await file.text());
  const header = rows.shift()?.map((h) => h.trim().toLowerCase());
  if (!header || !["nis", "nama", "kelas"].every((col) => header.includes(col))) {
    return fieldError("file", "Baris pertama harus berisi judul kolom: nis, nama, kelas.", formData);
  }
  if (rows.length === 0) return fieldError("file", "File tidak berisi data siswa.", formData);
  if (rows.length > MAX_ROWS) return fieldError("file", `Maksimal ${MAX_ROWS} siswa per impor.`, formData);

  const col = { nis: header.indexOf("nis"), nama: header.indexOf("nama"), kelas: header.indexOf("kelas") };
  const errors: string[] = [];
  const students: z.infer<typeof rowSchema>[] = [];
  const seen = new Map<string, number>();

  rows.forEach((row, i) => {
    const line = i + 2; // +1 judul kolom, +1 karena baris dihitung dari 1
    const parsed = rowSchema.safeParse({ nis: row[col.nis] ?? "", name: row[col.nama] ?? "", className: row[col.kelas] ?? "" });
    if (!parsed.success) {
      errors.push(`Baris ${line}: ${parsed.error.issues.map((issue) => issue.message).join(" ")}`);
      return;
    }
    const firstLine = seen.get(parsed.data.nis);
    if (firstLine) {
      errors.push(`Baris ${line}: NIS ${parsed.data.nis} sama dengan baris ${firstLine}.`);
      return;
    }
    seen.set(parsed.data.nis, line);
    students.push(parsed.data);
  });

  if (errors.length === 0) {
    const nisList = students.map((s) => s.nis);
    const [existingStudents, existingUsers] = await Promise.all([
      prisma.student.findMany({ where: { nis: { in: nisList } }, select: { nis: true } }),
      prisma.user.findMany({ where: { username: { in: nisList } }, select: { username: true } }),
    ]);
    const taken = new Set([...existingStudents.map((s) => s.nis), ...existingUsers.map((u) => u.username)]);
    for (const s of students) {
      if (taken.has(s.nis)) errors.push(`Baris ${seen.get(s.nis)}: NIS ${s.nis} sudah terdaftar.`);
    }
  }

  if (errors.length > 0) {
    const shown = errors.slice(0, MAX_ERRORS_SHOWN);
    const more = errors.length - shown.length;
    return {
      message: [
        `Impor dibatalkan, tidak ada data yang disimpan. Perbaiki ${errors.length} kesalahan berikut lalu unggah ulang:`,
        ...shown,
        ...(more > 0 ? [`...dan ${more} kesalahan lainnya.`] : []),
      ].join("\n"),
      values: {},
    };
  }

  // Satu hash untuk semua akun karena password awalnya sama; siswa sebaiknya menggantinya nanti.
  const passwordHash = await hashPassword(password.data);
  await prisma.$transaction(
    students.map((s) =>
      prisma.student.create({
        data: {
          nis: s.nis,
          name: s.name,
          className: s.className,
          user: { create: { username: s.nis, role: "STUDENT", passwordHash } },
        },
      }),
    ),
  );

  await logAudit({
    userId: admin.id,
    action: "STUDENT_IMPORT",
    entity: "students",
    detail: { count: students.length, fileName: file.name },
  });

  revalidatePath("/admin", "layout");
  redirect("/admin/siswa");
}
