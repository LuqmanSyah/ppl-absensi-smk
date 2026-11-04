import { ActionForm } from "@/components/form/action-form";
import { FormSection, TextField } from "@/components/form/fields";
import type { FormState } from "@/lib/forms";

export function ParentForm({
  action,
  parent,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  parent?: { name: string; username: string };
}) {
  const isEdit = !!parent;
  return (
    <ActionForm action={action} submitLabel={isEdit ? "Simpan perubahan" : "Tambah orang tua"}>
      <FormSection title="Data orang tua / wali">
        <TextField name="name" label="Nama lengkap" defaultValue={parent?.name} required />
      </FormSection>
      <FormSection title="Akun login">
        <TextField
          name="username"
          label="Username"
          autoCapitalize="none"
          defaultValue={parent?.username}
          placeholder="ortu.rizky"
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
