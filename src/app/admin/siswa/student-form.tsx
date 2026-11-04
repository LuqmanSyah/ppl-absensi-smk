import { ActionForm } from "@/components/form/action-form";
import { FormSection, SelectField, TextField } from "@/components/form/fields";
import type { FormState } from "@/lib/forms";

type Student = { nis: string; name: string; className: string; parentId: number | null };

export function StudentForm({
  action,
  student,
  classNames,
  parentOptions,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  student?: Student;
  classNames: string[];
  parentOptions: { value: number; label: string }[];
}) {
  const isEdit = !!student;
  return (
    <ActionForm action={action} submitLabel={isEdit ? "Simpan perubahan" : "Tambah siswa"}>
      <FormSection title="Data siswa">
        <TextField
          name="nis"
          label="NIS"
          inputMode="numeric"
          defaultValue={student?.nis}
          hint="NIS juga dipakai sebagai username login siswa."
          required
        />
        <TextField name="name" label="Nama lengkap" defaultValue={student?.name} required />
        <TextField
          name="className"
          label="Kelas"
          list="class-names"
          defaultValue={student?.className}
          placeholder="XI RPL 1"
          hint="Tulis persis sama dengan kelas di jadwal pelajaran."
          required
        />
        <datalist id="class-names">
          {classNames.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <SelectField
          name="parentId"
          label="Orang tua / wali"
          placeholder="Belum dihubungkan"
          options={parentOptions}
          defaultValue={student?.parentId}
          hint="Akun orang tua dibuat lebih dulu di menu Orang Tua."
        />
      </FormSection>

      <FormSection title={isEdit ? "Ganti password (opsional)" : "Akun login"}>
        <TextField
          name="password"
          label={isEdit ? "Password baru" : "Password awal"}
          type="password"
          autoComplete="new-password"
          hint={isEdit ? "Kosongkan jika password tidak diganti. Minimal 8 karakter." : "Minimal 8 karakter. Berikan ke siswa secara langsung."}
          required={!isEdit}
        />
      </FormSection>
    </ActionForm>
  );
}
