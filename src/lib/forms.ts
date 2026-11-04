// Tipe dan helper bersama untuk form yang memakai Server Action + useActionState.
import { z } from "zod";

export type FormState = {
  /** Pesan umum di atas form (gagal atau berhasil). */
  message?: string;
  /** `true` jika pesan adalah pesan berhasil. */
  success?: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Nilai yang dikirim, dipakai untuk mengisi ulang form setelah gagal. Password tidak pernah ikut. */
  values?: Record<string, string>;
};

export const initialFormState: FormState = {};

/** Mengambil nilai teks dari FormData, kecuali password dan field internal Next.js. */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string" || key.startsWith("$") || /password/i.test(key)) continue;
    values[key] = value;
  }
  return values;
}

export function invalidForm(error: z.ZodError, formData: FormData): FormState {
  return {
    message: "Periksa kembali isian yang ditandai.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
    values: formValues(formData),
  };
}

export function fieldError(field: string, message: string, formData: FormData): FormState {
  return {
    message: "Periksa kembali isian yang ditandai.",
    fieldErrors: { [field]: [message] },
    values: formValues(formData),
  };
}
