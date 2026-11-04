import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/data-list";
import { requireRole } from "@/lib/dal";
import { getClassNames, getTeacherOptions } from "@/lib/queries/master-data";
import { createSchedule } from "../actions";
import { ScheduleForm } from "../schedule-form";

export default async function NewSchedulePage() {
  await requireRole("ADMIN");
  const [teacherOptions, classNames] = await Promise.all([getTeacherOptions(), getClassNames()]);
  return (
    <>
      <BackLink href="/admin/jadwal" label="Jadwal pelajaran" />
      <PageHeader title="Tambah Jadwal" />
      <ScheduleForm action={createSchedule} teacherOptions={teacherOptions} classNames={classNames} />
    </>
  );
}
