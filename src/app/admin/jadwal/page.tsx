import type { Prisma } from "@/generated/prisma/client";
import { PageHeader } from "@/components/page-header";
import { AddButton, EditLink, EmptyRow } from "@/components/data-list";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getClassNames, getTeacherOptions } from "@/lib/queries/master-data";
import { DAY_LABELS, dateToTime } from "@/lib/schedule-time";
import { selectClassName } from "@/lib/styles";

export default async function SchedulesPage({ searchParams }: PageProps<"/admin/jadwal">) {
  await requireRole("ADMIN");
  const { kelas, guru } = await searchParams;
  const classFilter = typeof kelas === "string" ? kelas : "";
  const teacherFilter = typeof guru === "string" && /^\d+$/.test(guru) ? Number(guru) : undefined;

  const where: Prisma.ScheduleWhereInput = {
    ...(classFilter && { className: classFilter }),
    ...(teacherFilter && { teacherId: teacherFilter }),
  };

  const [schedules, classNames, teacherOptions] = await Promise.all([
    prisma.schedule.findMany({
      where,
      orderBy: [{ day: "asc" }, { startTime: "asc" }, { className: "asc" }],
      include: { teacher: { select: { name: true } } },
    }),
    getClassNames(),
    getTeacherOptions(),
  ]);

  return (
    <>
      <PageHeader
        title="Jadwal Pelajaran"
        description="Sesi absensi hanya bisa dibuka guru sesuai jadwal di sini."
        action={<AddButton href="/admin/jadwal/baru" label="Tambah jadwal" />}
      />
      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <select name="kelas" defaultValue={classFilter} aria-label="Filter kelas" className={`${selectClassName} w-auto`}>
          <option value="">Kelas: semua</option>
          {classNames.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select name="guru" defaultValue={teacherFilter ?? ""} aria-label="Filter guru" className={`${selectClassName} w-auto`}>
          <option value="">Guru: semua</option>
          {teacherOptions.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button type="submit" className={buttonVariants({ variant: "outline" })}>Terapkan</button>
      </form>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hari</TableHead>
              <TableHead>Jam</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>Mata pelajaran</TableHead>
              <TableHead>Guru</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.length === 0 && <EmptyRow colSpan={6}>Belum ada jadwal.</EmptyRow>}
            {schedules.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{DAY_LABELS[s.day]}</TableCell>
                <TableCell className="tabular-nums">
                  {dateToTime(s.startTime)}-{dateToTime(s.endTime)}
                </TableCell>
                <TableCell>{s.className}</TableCell>
                <TableCell className="font-medium">{s.subject}</TableCell>
                <TableCell className="text-muted-foreground">{s.teacher.name}</TableCell>
                <TableCell className="text-right">
                  <EditLink href={`/admin/jadwal/${s.id}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
