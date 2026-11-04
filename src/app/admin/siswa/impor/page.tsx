import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/data-list";
import { ActionForm } from "@/components/form/action-form";
import { TextField } from "@/components/form/fields";
import { requireRole } from "@/lib/dal";
import { importStudents } from "./actions";

export default async function ImportStudentsPage() {
  await requireRole("ADMIN");
  return (
    <>
      <BackLink href="/admin/siswa" label="Data siswa" />
      <PageHeader title="Impor Siswa dari CSV" description="Untuk mendaftarkan banyak siswa sekaligus." />

      <div className="mb-6 max-w-xl rounded-xl border border-dashed bg-muted/40 p-4 text-sm">
        <p className="font-medium">Format file</p>
        <p className="mt-1 text-muted-foreground">
          Baris pertama berisi judul kolom <code>nis</code>, <code>nama</code>, <code>kelas</code>. Pemisah boleh koma
          atau titik koma. Dari Excel, simpan dengan &quot;Save As&quot; → CSV.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-background p-3 font-mono text-xs">
{`nis,nama,kelas
2024101,Andi Saputra,X RPL 1
2024102,Bunga Citra,X RPL 1`}
        </pre>
        <p className="mt-3 text-muted-foreground">
          Jika ada satu baris yang salah, seluruh impor dibatalkan dan daftar kesalahannya ditampilkan. Hubungkan orang
          tua lewat halaman ubah siswa setelah impor.
        </p>
      </div>

      <ActionForm action={importStudents} submitLabel="Impor siswa">
        <TextField name="file" label="File CSV" type="file" accept=".csv,text/csv" required />
        <TextField
          name="password"
          label="Password awal untuk semua siswa"
          type="password"
          autoComplete="new-password"
          hint="Minimal 8 karakter. Username setiap siswa adalah NIS-nya."
          required
        />
      </ActionForm>
    </>
  );
}
