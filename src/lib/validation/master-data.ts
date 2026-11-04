// Skema validasi data master (FR-02, FR-17). Dipakai di Server Action, jadi validasi
// tetap berlaku walaupun validasi di browser dilewati.
import { z } from "zod";

/** String kosong dari form dianggap tidak diisi. */
const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const name = z
  .string({ error: "Nama wajib diisi." })
  .trim()
  .min(3, "Nama minimal 3 karakter.")
  .max(100, "Nama maksimal 100 karakter.");

const className = z
  .string({ error: "Kelas wajib diisi." })
  .trim()
  .transform((v) => v.replace(/\s+/g, " ").toUpperCase())
  .pipe(
    z
      .string()
      .min(1, "Kelas wajib diisi.")
      .max(30, "Kelas maksimal 30 karakter.")
      .regex(/^[A-Z0-9 -]+$/, "Kelas hanya berisi huruf, angka, spasi, atau tanda hubung. Contoh: XI RPL 1."),
  );

const username = z
  .string({ error: "Username wajib diisi." })
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._]{3,50}$/, "Username 3-50 karakter, hanya huruf kecil, angka, titik, atau garis bawah.");

const password = z
  .string({ error: "Password wajib diisi." })
  .min(8, "Password minimal 8 karakter.")
  .max(100, "Password maksimal 100 karakter.");

const optionalPassword = z.preprocess(emptyToUndefined, password.optional());

const nis = z
  .string({ error: "NIS wajib diisi." })
  .trim()
  .regex(/^\d{4,20}$/, "NIS hanya berisi angka, 4-20 digit.");

const nip = z
  .string({ error: "NIP wajib diisi." })
  .trim()
  .regex(/^\d{8,30}$/, "NIP hanya berisi angka, 8-30 digit.");

const optionalId = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().positive("Pilihan tidak valid.").optional(),
);

const requiredId = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number({ error: `${label} wajib dipilih.` }).int().positive(`${label} wajib dipilih.`),
  );

const time = z
  .string({ error: "Jam wajib diisi." })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam HH:MM, contoh 07:30.");

// ---------- Siswa ----------

export const studentCreateSchema = z.object({
  nis,
  name,
  className,
  parentId: optionalId,
  password,
});

export const studentUpdateSchema = studentCreateSchema.extend({ password: optionalPassword });

// ---------- Guru ----------

export const teacherCreateSchema = z.object({
  nip,
  name,
  username,
  password,
});

export const teacherUpdateSchema = teacherCreateSchema.extend({ password: optionalPassword });

// ---------- Orang tua ----------

export const parentCreateSchema = z.object({
  name,
  username,
  password,
});

export const parentUpdateSchema = parentCreateSchema.extend({ password: optionalPassword });

// ---------- Jadwal ----------

export const scheduleSchema = z
  .object({
    teacherId: requiredId("Guru"),
    className,
    subject: z
      .string({ error: "Mata pelajaran wajib diisi." })
      .trim()
      .min(2, "Mata pelajaran minimal 2 karakter.")
      .max(100, "Mata pelajaran maksimal 100 karakter."),
    day: z.coerce
      .number({ error: "Hari wajib dipilih." })
      .int()
      .min(1, "Hari wajib dipilih.")
      .max(7, "Hari tidak valid."),
    startTime: time,
    endTime: time,
  })
  .refine((v) => v.endTime > v.startTime, {
    path: ["endTime"],
    message: "Jam selesai harus setelah jam mulai.",
  });

// ---------- Lokasi sekolah ----------

const coordinate = (label: string, min: number, max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim().replace(",", ".") : v),
    z.coerce
      .number({ error: `${label} harus berupa angka.` })
      .min(min, `${label} harus antara ${min} dan ${max}.`)
      .max(max, `${label} harus antara ${min} dan ${max}.`),
  );

export const locationSchema = z.object({
  name,
  latitude: coordinate("Latitude", -90, 90),
  longitude: coordinate("Longitude", -180, 180),
  radiusM: z.coerce
    .number({ error: "Radius harus berupa angka." })
    .int("Radius harus bilangan bulat.")
    .min(20, "Radius minimal 20 meter.")
    .max(2000, "Radius maksimal 2000 meter."),
  isActive: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});
