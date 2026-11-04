import { notFound } from "next/navigation";
import { BackLink } from "@/components/data-list";
import { PageHeader } from "@/components/page-header";
import { PeriodFilter } from "@/components/attendance/period-filter";
import { StudentHistory } from "@/components/attendance/student-history";
import { requireRole } from "@/lib/dal";
import { parseId } from "@/lib/params";
import { getStudentReport, parsePeriod } from "@/lib/attendance/report";
import { schoolNow } from "@/lib/attendance/server";

export default async function StudentReportPage({ params, searchParams }: PageProps<"/admin/laporan/siswa/[id]">) {
  await requireRole("ADMIN");
  const id = parseId((await params).id);
  if (!id) notFound();
  const sp = await searchParams;
  const { from, to } = parsePeriod(sp.dari, sp.sampai, schoolNow().date);

  const report = await getStudentReport(id, from, to);
  if (!report) notFound();

  return (
    <>
      <BackLink href={`/admin/laporan?kelas=${encodeURIComponent(report.student.className)}&dari=${from}&sampai=${to}`} label="Rekap kelas" />
      <PageHeader title={report.student.name} description={`NIS ${report.student.nis} · ${report.student.className}`} />
      <PeriodFilter from={from} to={to} />
      <StudentHistory report={report} />
    </>
  );
}
