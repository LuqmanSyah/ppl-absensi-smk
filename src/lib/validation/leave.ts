import { z } from "zod";

const date = (label: string) =>
  z.string({ error: `${label} wajib diisi.` }).regex(/^\d{4}-\d{2}-\d{2}$/, `${label} wajib diisi.`);

/** Pengajuan izin/sakit (FR-11). Rentang tanggal relatif terhadap "hari ini" dicek di server action. */
export const leaveSchema = z
  .object({
    type: z.enum(["IZIN", "SAKIT"], { error: "Pilih jenis pengajuan." }),
    dateFrom: date("Tanggal mulai"),
    dateTo: date("Tanggal selesai"),
    reason: z
      .string({ error: "Alasan wajib diisi." })
      .trim()
      .min(10, "Tuliskan alasan minimal 10 karakter.")
      .max(500, "Alasan maksimal 500 karakter."),
  })
  .refine((v) => v.dateTo >= v.dateFrom, { path: ["dateTo"], message: "Tanggal selesai tidak boleh sebelum tanggal mulai." });

export const LEAVE_MAX_DAYS = 14;
export const LEAVE_MAX_BACKDATE_DAYS = 7;
