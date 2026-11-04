import { ActionForm } from "@/components/form/action-form";
import { SelectField, TextField } from "@/components/form/fields";
import type { FormState } from "@/lib/forms";
import { DAY_LABELS } from "@/lib/schedule-time";

const DAY_OPTIONS = Object.entries(DAY_LABELS).map(([value, label]) => ({ value, label }));

export function ScheduleForm({
  action,
  schedule,
  teacherOptions,
  classNames,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  schedule?: { teacherId: number; className: string; subject: string; day: number; startTime: string; endTime: string };
  teacherOptions: { value: number; label: string }[];
  classNames: string[];
}) {
  return (
    <ActionForm action={action} submitLabel={schedule ? "Simpan perubahan" : "Tambah jadwal"}>
      <SelectField
        name="teacherId"
        label="Guru"
        placeholder="Pilih guru"
        options={teacherOptions}
        defaultValue={schedule?.teacherId}
        hint="Hanya guru dengan akun aktif yang bisa dipilih."
      />
      <TextField
        name="className"
        label="Kelas"
        list="class-names"
        defaultValue={schedule?.className}
        placeholder="XI RPL 1"
        hint="Harus sama persis dengan kelas siswa."
        required
      />
      <datalist id="class-names">
        {classNames.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <TextField name="subject" label="Mata pelajaran" defaultValue={schedule?.subject} required />
      <SelectField name="day" label="Hari" placeholder="Pilih hari" options={DAY_OPTIONS} defaultValue={schedule?.day} />
      <div className="grid grid-cols-2 gap-4">
        <TextField name="startTime" label="Jam mulai" type="time" defaultValue={schedule?.startTime} required />
        <TextField name="endTime" label="Jam selesai" type="time" defaultValue={schedule?.endTime} required />
      </div>
    </ActionForm>
  );
}
