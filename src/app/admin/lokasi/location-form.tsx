import { ActionForm } from "@/components/form/action-form";
import { CheckboxField, TextField } from "@/components/form/fields";
import type { FormState } from "@/lib/forms";

export function LocationForm({
  action,
  location,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  location?: { name: string; latitude: string; longitude: string; radiusM: number; isActive: boolean };
}) {
  return (
    <ActionForm action={action} submitLabel={location ? "Simpan perubahan" : "Tambah lokasi"}>
      <TextField name="name" label="Nama lokasi" defaultValue={location?.name} placeholder="Gedung utama" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="latitude"
          label="Latitude"
          inputMode="decimal"
          defaultValue={location?.latitude}
          placeholder="-6.1751100"
          required
        />
        <TextField
          name="longitude"
          label="Longitude"
          inputMode="decimal"
          defaultValue={location?.longitude}
          placeholder="106.8650390"
          required
        />
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Cara mendapatkan koordinat: buka Google Maps, klik kanan titik tengah sekolah, lalu klik angka koordinat
        yang muncul untuk menyalinnya. Angka pertama latitude, angka kedua longitude.
      </p>
      <TextField
        name="radiusM"
        label="Radius (meter)"
        type="number"
        inputMode="numeric"
        min={20}
        max={2000}
        defaultValue={location?.radiusM ?? 100}
        hint="Jarak maksimal dari titik di atas agar absensi diterima. Jangan terlalu kecil karena GPS di dalam gedung kurang akurat."
        required
      />
      <CheckboxField
        name="isActive"
        label="Jadikan lokasi aktif"
        defaultChecked={location?.isActive ?? true}
        hint="Hanya satu lokasi yang aktif. Lokasi aktif sebelumnya otomatis dinonaktifkan."
      />
    </ActionForm>
  );
}
