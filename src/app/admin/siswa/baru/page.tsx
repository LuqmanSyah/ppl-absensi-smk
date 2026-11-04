import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/data-list";
import { requireRole } from "@/lib/dal";
import { getClassNames, getParentOptions } from "@/lib/queries/master-data";
import { createStudent } from "../actions";
import { StudentForm } from "../student-form";

export default async function NewStudentPage() {
  await requireRole("ADMIN");
  const [classNames, parentOptions] = await Promise.all([getClassNames(), getParentOptions()]);
  return (
    <>
      <BackLink href="/admin/siswa" label="Data siswa" />
      <PageHeader title="Tambah Siswa" description="Akun login siswa dibuat otomatis dengan username = NIS." />
      <StudentForm action={createStudent} classNames={classNames} parentOptions={parentOptions} />
    </>
  );
}
