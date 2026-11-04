import { ActionForm } from "@/components/form/action-form";
import { FormSection, TextField } from "@/components/form/fields";
import type { FormState } from "@/lib/forms";

export function TeacherForm({
  action,
  teacher,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  teacher?: { nip: string; name: string; username: string };
}) {
  const isEdit = !!teacher;
  return (
    <ActionForm action={action} submitLabel={isEdit ? "Simpan perubahan" : "Tambah guru"}>
      <FormSection title="Data guru">
        <TextField name="nip" label="NIP" inputMode="numeric" defaultValue={teacher?.nip} required />
        <TextField name="name" label="Nama lengkap" defaultValue={teacher?.name} hint="Tulis lengkap dengan gelar." required />
      </FormSection>
      <FormSection title="Akun login">
        <TextField
          name="username"
          label="Username"
          autoCapitalize="none"
          defaultValue={teacher?.username}
          placeholder="budi.santoso"
          hint="Huruf kecil, angka, titik, atau garis bawah."
          required
        />
        <TextField
          name="password"
          label={isEdit ? "Password baru (opsional)" : "Password awal"}
          type="password"
          autoComplete="new-password"
          hint={isEdit ? "Kosongkan jika password tidak diganti. Minimal 8 karakter." : "Minimal 8 karakter."}
          required={!isEdit}
        />
      </FormSection>
    </ActionForm>
  );
}
