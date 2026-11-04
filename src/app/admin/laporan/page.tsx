import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PeriodFilter } from "@/components/attendance/period-filter";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/dal";
import { getClassNames } from "@/lib/queries/master-data";
import { getClassReport, parsePeriod } from "@/lib/attendance/report";
import { schoolNow } from "@/lib/attendance/server";

export default async function ReportPage({ searchParams }: PageProps<"/admin/laporan">) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const classNames = await getClassNames();
  const className = typeof params.kelas === "string" && classNames.includes(params.kelas) ? params.kelas : classNames[0];
  const { from, to } = parsePeriod(params.dari, params.sampai, schoolNow().date);

  const report = className ? await getClassReport(className, from, to) : null;
  const query = new URLSearchParams({ kelas: className ?? "", dari: from, sampai: to }).toString();

  return (
    <>
      <PageHeader
        title="Rekap Kehadiran"
        description="Jumlah per pelajaran (sesi absensi) dalam periode yang dipilih. Alpa = tidak absen dan tidak ada izin/sakit yang disetujui. Tidak selesai = hadir tetapi tidak absen selesai (tidak mengurangi persentase)."
        action={
          report && (
            <a href={`/admin/laporan/excel?${query}`} className={buttonVariants()} download>
              <Download aria-hidden />
              Unduh Excel
            </a>
          )
        }
      />
      <PeriodFilter
        from={from}
        to={to}
        select={{ name: "kelas", label: "Kelas", value: className ?? "", options: classNames.map((c) => ({ value: c, label: c })) }}
      />

      {!report ? (
        <p className="text-sm text-muted-foreground">Belum ada kelas. Tambahkan siswa atau jadwal lebih dulu.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground" data-testid="report-meta">
            Kelas {report.className} · {report.sessionCount} sesi · {report.rows.length} siswa aktif
          </p>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIS</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="text-right">Hadir</TableHead>
                  <TableHead className="text-right">Terlambat</TableHead>
                  <TableHead className="text-right">Izin</TableHead>
                  <TableHead className="text-right">Sakit</TableHead>
                  <TableHead className="text-right">Alpa</TableHead>
                  <TableHead className="text-right">Tidak selesai</TableHead>
                  <TableHead className="text-right">Kehadiran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      Tidak ada siswa aktif di kelas ini.
                    </TableCell>
                  </TableRow>
                )}
                {report.rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.nis}</TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/laporan/siswa/${r.id}?dari=${from}&sampai=${to}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.counts.HADIR}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.counts.TERLAMBAT}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.counts.IZIN}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.counts.SAKIT}</TableCell>
                    <TableCell className={`text-right tabular-nums ${r.counts.ALPA > 0 ? "font-semibold text-destructive" : ""}`}>
                      {r.counts.ALPA}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.counts.tidakSelesai}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.counts.percent === null ? "-" : `${r.counts.percent}%`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {report.rows.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right tabular-nums">{report.totals.HADIR}</TableCell>
                    <TableCell className="text-right tabular-nums">{report.totals.TERLAMBAT}</TableCell>
                    <TableCell className="text-right tabular-nums">{report.totals.IZIN}</TableCell>
                    <TableCell className="text-right tabular-nums">{report.totals.SAKIT}</TableCell>
                    <TableCell className="text-right tabular-nums">{report.totals.ALPA}</TableCell>
                    <TableCell className="text-right tabular-nums">{report.totals.tidakSelesai}</TableCell>
                    <TableCell className="text-right tabular-nums">{report.totals.percent === null ? "-" : `${report.totals.percent}%`}</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </>
      )}
    </>
  );
}
