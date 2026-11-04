import { PageHeader } from "@/components/page-header";
import { requireRole } from "@/lib/dal";

// Placeholder: diisi pada item backlog S1-04.
export default async function Page() {
  await requireRole("ADMIN");
  return (
    <>
      <PageHeader title="Data Siswa" />
      <p className="text-sm text-muted-foreground">Halaman ini sedang dikerjakan (S1-04).</p>
    </>
  );
}
