// Ekspor rekap kehadiran ke Excel (S3-03, FR-16).
import ExcelJS from "exceljs";
import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/dal";
import { logAudit } from "@/lib/audit";
import { getClassNames } from "@/lib/queries/master-data";
import { getClassReport, parsePeriod } from "@/lib/attendance/report";
import { schoolNow } from "@/lib/attendance/server";

export async function GET(request: NextRequest) {
  const admin = await requireRole("ADMIN");
  const params = request.nextUrl.searchParams;
  const className = params.get("kelas") ?? "";
  if (!(await getClassNames()).includes(className)) {
    return new Response("Kelas tidak ditemukan.", { status: 400 });
  }
  const { from, to } = parsePeriod(params.get("dari"), params.get("sampai"), schoolNow().date);
  const report = await getClassReport(className, from, to);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Absensi SMK Putra Perdana";
  const sheet = workbook.addWorksheet("Rekap");

  sheet.addRow(["Rekap Kehadiran Siswa"]).font = { bold: true, size: 14 };
  sheet.addRow([`Kelas: ${className}`]);
  sheet.addRow([`Periode: ${from} s.d. ${to}`]);
  sheet.addRow([`Jumlah sesi: ${report.sessionCount}`]);
  sheet.addRow([]);

  const header = sheet.addRow(["No", "NIS", "Nama", "Hadir", "Terlambat", "Izin", "Sakit", "Alpa", "Tidak absen selesai", "Kehadiran (%)"]);
  header.font = { bold: true };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
    cell.border = { bottom: { style: "thin" } };
  });

  report.rows.forEach((r, i) => {
    const c = r.counts;
    sheet.addRow([i + 1, r.nis, r.name, c.HADIR, c.TERLAMBAT, c.IZIN, c.SAKIT, c.ALPA, c.tidakSelesai, c.percent ?? "-"]);
  });
  const t = report.totals;
  sheet.addRow(["", "", "Total", t.HADIR, t.TERLAMBAT, t.IZIN, t.SAKIT, t.ALPA, t.tidakSelesai, t.percent ?? "-"]).font = { bold: true };

  sheet.columns.forEach((col, i) => {
    col.width = [5, 14, 32, 8, 11, 8, 8, 8, 18, 14][i];
  });
  sheet.addRow([]);
  sheet.addRow(["Keterangan: Alpa = tidak absen dan tidak ada izin/sakit yang disetujui. Tidak absen selesai = hadir tetapi tidak absen selesai. Persentase = (Hadir + Terlambat) / jumlah sesi."]);

  const buffer = await workbook.xlsx.writeBuffer();
  await logAudit({ userId: admin.id, action: "REPORT_EXPORT", detail: { className, from, to } });

  const filename = `rekap-${className.replace(/\s+/g, "-")}-${from}-sd-${to}.xlsx`;
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
