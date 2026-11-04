import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/data-list";
import { AccountStatusCard } from "@/components/account-status-card";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/params";
import { updateTeacher } from "../actions";
import { TeacherForm } from "../teacher-form";

export default async function EditTeacherPage({ params }: PageProps<"/admin/guru/[id]">) {
  await requireRole("ADMIN");
  const id = parseId((await params).id);
  if (!id) notFound();

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    select: {
      nip: true,
      name: true,
      user: { select: { id: true, username: true, isActive: true } },
      _count: { select: { schedules: true } },
    },
  });
  if (!teacher) notFound();

  return (
    <>
      <BackLink href="/admin/guru" label="Data guru" />
      <PageHeader
        title={teacher.name}
        description={`NIP ${teacher.nip} · ${teacher._count.schedules} jadwal mengajar`}
        action={
          <Link href={`/admin/jadwal?guru=${id}`} className="text-sm underline underline-offset-4">
            Lihat jadwal
          </Link>
        }
      />
      <div className="flex flex-col gap-6">
        <TeacherForm
          action={updateTeacher.bind(null, id)}
          teacher={{ nip: teacher.nip, name: teacher.name, username: teacher.user.username }}
        />
        <AccountStatusCard userId={teacher.user.id} username={teacher.user.username} isActive={teacher.user.isActive} />
      </div>
    </>
  );
}
