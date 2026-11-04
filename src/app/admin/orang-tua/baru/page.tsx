import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/data-list";
import { requireRole } from "@/lib/dal";
import { createParent } from "../actions";
import { ParentForm } from "../parent-form";

export default async function NewParentPage() {
  await requireRole("ADMIN");
  return (
    <>
      <BackLink href="/admin/orang-tua" label="Data orang tua" />
      <PageHeader title="Tambah Orang Tua" description="Setelah akun dibuat, hubungkan ke anak dari halaman ubah siswa." />
      <ParentForm action={createParent} />
    </>
  );
}
