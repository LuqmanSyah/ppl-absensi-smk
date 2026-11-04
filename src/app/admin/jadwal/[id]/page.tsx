import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/data-list";
import { ConfirmActionButton } from "@/components/form/confirm-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/params";
import { getClassNames, getTeacherOptions } from "@/lib/queries/master-data";
import { DAY_LABELS, dateToTime } from "@/lib/schedule-time";
import { deleteSchedule, updateSchedule } from "../actions";
import { ScheduleForm } from "../schedule-form";

export default async function EditSchedulePage({ params }: PageProps<"/admin/jadwal/[id]">) {
  await requireRole("ADMIN");
  const id = parseId((await params).id);
  if (!id) notFound();

  const [schedule, teacherOptions, classNames] = await Promise.all([
    prisma.schedule.findUnique({
      where: { id },
      include: { teacher: { select: { name: true, user: { select: { isActive: true } } } } },
    }),
    getTeacherOptions(),
    getClassNames(),
  ]);
  if (!schedule) notFound();

  // Guru nonaktif tidak ada di pilihan; tetap tampilkan agar form tidak kehilangan nilainya.
  const options = teacherOptions.some((t) => t.value === schedule.teacherId)
    ? teacherOptions
    : [{ value: schedule.teacherId, label: `${schedule.teacher.name} (nonaktif)` }, ...teacherOptions];

  return (
    <>
      <BackLink href="/admin/jadwal" label="Jadwal pelajaran" />
      <PageHeader
        title={`${schedule.subject} · ${schedule.className}`}
        description={`${DAY_LABELS[schedule.day]} ${dateToTime(schedule.startTime)}-${dateToTime(schedule.endTime)}`}
      />
      <div className="flex flex-col gap-6">
        <ScheduleForm
          action={updateSchedule.bind(null, id)}
          teacherOptions={options}
          classNames={classNames}
          schedule={{
            teacherId: schedule.teacherId,
            className: schedule.className,
            subject: schedule.subject,
            day: schedule.day,
            startTime: dateToTime(schedule.startTime),
            endTime: dateToTime(schedule.endTime),
          }}
        />
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-base">Hapus jadwal</CardTitle>
            <CardDescription>Jadwal yang sudah dipakai di sesi absensi tidak bisa dihapus agar riwayat tetap utuh.</CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmActionButton
              action={deleteSchedule.bind(null, id)}
              label="Hapus jadwal"
              confirmLabel="Hapus jadwal ini?"
              variant="destructive"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
