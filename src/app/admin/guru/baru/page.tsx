import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/data-list";
import { requireRole } from "@/lib/dal";
import { createTeacher } from "../actions";
import { TeacherForm } from "../teacher-form";

export default async function NewTeacherPage() {
  await requireRole("ADMIN");
  return (
    <>
      <BackLink href="/admin/guru" label="Data guru" />
      <PageHeader title="Tambah Guru" />
      <TeacherForm action={createTeacher} />
    </>
  );
}
