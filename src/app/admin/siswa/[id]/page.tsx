import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/data-list";
import { AccountStatusCard } from "@/components/account-status-card";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getClassNames, getParentOptions } from "@/lib/queries/master-data";
import { parseId } from "@/lib/params";
import { updateStudent } from "../actions";
import { StudentForm } from "../student-form";

export default async function EditStudentPage({ params }: PageProps<"/admin/siswa/[id]">) {
  await requireRole("ADMIN");
  const id = parseId((await params).id);
  if (!id) notFound();

  const [student, classNames, parentOptions] = await Promise.all([
    prisma.student.findUnique({
      where: { id },
      select: {
        nis: true,
        name: true,
        className: true,
        parentId: true,
        user: { select: { id: true, username: true, isActive: true } },
      },
    }),
    getClassNames(),
    getParentOptions(),
  ]);
  if (!student) notFound();

  return (
    <>
      <BackLink href="/admin/siswa" label="Data siswa" />
      <PageHeader title={student.name} description={`NIS ${student.nis} · ${student.className}`} />
      <div className="flex flex-col gap-6">
        <StudentForm
          action={updateStudent.bind(null, id)}
          student={student}
          classNames={classNames}
          parentOptions={parentOptions}
        />
        <AccountStatusCard userId={student.user.id} username={student.user.username} isActive={student.user.isActive} />
      </div>
    </>
  );
}
