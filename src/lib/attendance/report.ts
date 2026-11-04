// Rekap kehadiran per periode (FR-14, FR-16). Satu sumber perhitungan untuk laporan admin,
// ekspor Excel, dan halaman orang tua, agar angkanya selalu sama.
//
// Aturan per siswa per sesi (sama dengan daftar hadir guru):
//   ada catatan absensi           -> HADIR / TERLAMBAT (+ "tidak selesai" jika tanpa absen selesai)
//   izin/sakit disetujui          -> IZIN / SAKIT
//   sesi masih berjalan           -> BELUM (tidak dihitung sebagai alpa)
//   selain itu                    -> ALPA
import "server-only";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { zonedParts, zonedToUtc } from "@/lib/time";
import { isSessionOpen } from "./server";

export type ReportStatus = "HADIR" | "TERLAMBAT" | "IZIN" | "SAKIT" | "ALPA" | "BELUM";

export type ReportCounts = Record<Exclude<ReportStatus, "BELUM">, number> & {
  /** Hadir/terlambat tetapi tidak absen selesai. Keterangan saja, tidak mengubah persentase. */
  tidakSelesai: number;
  /** Sesi yang sudah selesai (dasar persentase). */
  total: number;
  /** Persentase hadir + terlambat terhadap total, dibulatkan. `null` jika belum ada sesi. */
  percent: number | null;
};

/** "YYYY-MM-DD" ditambah n hari. */
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Rentang tanggal lokal (inklusif) menjadi rentang UTC [start, end). */
function utcRange(from: string, to: string) {
  return { start: zonedToUtc(from, "00:00", config.timezone), end: zonedToUtc(addDays(to, 1), "00:00", config.timezone) };
}

function emptyCounts(): ReportCounts {
  return { HADIR: 0, TERLAMBAT: 0, IZIN: 0, SAKIT: 0, ALPA: 0, tidakSelesai: 0, total: 0, percent: null };
}

function finalize(c: ReportCounts): ReportCounts {
  c.total = c.HADIR + c.TERLAMBAT + c.IZIN + c.SAKIT + c.ALPA;
  c.percent = c.total ? Math.round(((c.HADIR + c.TERLAMBAT) / c.total) * 100) : null;
  return c;
}

type Leave = { studentId: number; type: "IZIN" | "SAKIT"; dateFrom: Date; dateTo: Date };

function leaveFor(leaves: Leave[], studentId: number, sessionDate: string) {
  const day = new Date(`${sessionDate}T00:00:00Z`).getTime();
  return leaves.find((l) => l.studentId === studentId && l.dateFrom.getTime() <= day && l.dateTo.getTime() >= day);
}

function statusFor(
  attendance: { status: "HADIR" | "TERLAMBAT" } | undefined,
  leave: Leave | undefined,
  sessionOpen: boolean,
): ReportStatus {
  if (attendance) return attendance.status;
  if (leave) return leave.type;
  return sessionOpen ? "BELUM" : "ALPA";
}

/** Rekap satu kelas: jumlah status per siswa dalam rentang tanggal. */
export async function getClassReport(className: string, from: string, to: string) {
  const { start, end } = utcRange(from, to);
  const now = new Date();

  const [sessions, students] = await Promise.all([
    prisma.attendanceSession.findMany({
      where: { schedule: { className }, openedAt: { gte: start, lt: end } },
      orderBy: { openedAt: "asc" },
      select: { id: true, openedAt: true, status: true, expiresAt: true },
    }),
    prisma.student.findMany({
      where: { className, user: { isActive: true } },
      orderBy: { name: "asc" },
      select: { id: true, nis: true, name: true },
    }),
  ]);
  const studentIds = students.map((s) => s.id);

  const [attendances, leaves] = await Promise.all([
    prisma.attendance.findMany({
      where: { sessionId: { in: sessions.map((s) => s.id) }, studentId: { in: studentIds } },
      select: { sessionId: true, studentId: true, status: true, checkOutAt: true },
    }),
    prisma.leaveRequest.findMany({
      where: { studentId: { in: studentIds }, status: "APPROVED", dateFrom: { lte: new Date(`${to}T00:00:00Z`) }, dateTo: { gte: new Date(`${from}T00:00:00Z`) } },
      select: { studentId: true, type: true, dateFrom: true, dateTo: true },
    }),
  ]);
  const attendanceByKey = new Map(attendances.map((a) => [`${a.sessionId}:${a.studentId}`, a]));

  const rows = students.map((student) => {
    const counts = emptyCounts();
    for (const session of sessions) {
      const date = zonedParts(session.openedAt, config.timezone).date;
      const attendance = attendanceByKey.get(`${session.id}:${student.id}`);
      const open = isSessionOpen(session, now);
      const status = statusFor(attendance, leaveFor(leaves, student.id, date), open);
      if (status !== "BELUM") counts[status]++;
      if (attendance && !attendance.checkOutAt && !open) counts.tidakSelesai++;
    }
    return { ...student, counts: finalize(counts) };
  });

  const totals = finalize(
    rows.reduce((acc, r) => {
      for (const k of ["HADIR", "TERLAMBAT", "IZIN", "SAKIT", "ALPA", "tidakSelesai"] as const) acc[k] += r.counts[k];
      return acc;
    }, emptyCounts()),
  );

  return { className, from, to, sessionCount: sessions.length, rows, totals };
}

/** Riwayat satu siswa per sesi dalam rentang tanggal (untuk orang tua dan detail laporan). */
export async function getStudentReport(studentId: number, from: string, to: string) {
  const { start, end } = utcRange(from, to);
  const now = new Date();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, nis: true, name: true, className: true },
  });
  if (!student) return null;

  // Sesi kelas siswa saat ini, ditambah sesi lain yang memang ia hadiri (misalnya sebelum pindah kelas).
  const [sessions, leaves] = await Promise.all([
    prisma.attendanceSession.findMany({
      where: {
        openedAt: { gte: start, lt: end },
        OR: [{ schedule: { className: student.className } }, { attendances: { some: { studentId } } }],
      },
      orderBy: { openedAt: "desc" },
      include: {
        schedule: { select: { subject: true, className: true } },
        teacher: { select: { name: true } },
        attendances: { where: { studentId }, select: { status: true, checkInAt: true, checkOutAt: true } },
      },
    }),
    prisma.leaveRequest.findMany({
      where: { studentId, dateFrom: { lte: new Date(`${to}T00:00:00Z`) }, dateTo: { gte: new Date(`${from}T00:00:00Z`) } },
      orderBy: { dateFrom: "desc" },
    }),
  ]);
  const approved = leaves.filter((l) => l.status === "APPROVED");

  const counts = emptyCounts();
  const items = sessions.map((s) => {
    const attendance = s.attendances[0];
    const open = isSessionOpen(s, now);
    const status = statusFor(attendance, leaveFor(approved, studentId, zonedParts(s.openedAt, config.timezone).date), open);
    if (status !== "BELUM") counts[status]++;
    const checkoutMissing = !!attendance && !attendance.checkOutAt && !open;
    if (checkoutMissing) counts.tidakSelesai++;
    return {
      sessionId: s.id,
      openedAt: s.openedAt,
      subject: s.schedule.subject,
      teacherName: s.teacher.name,
      status,
      checkInAt: attendance?.checkInAt ?? null,
      checkOutAt: attendance?.checkOutAt ?? null,
      checkoutMissing,
    };
  });

  return { student, from, to, items, leaves, counts: finalize(counts) };
}

/** Membaca filter tanggal dari URL; default awal bulan ini sampai hari ini. Maksimal 1 tahun. */
export function parsePeriod(dari: unknown, sampai: unknown, today: string) {
  const valid = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
  let from = valid(dari) ? dari : `${today.slice(0, 7)}-01`;
  let to = valid(sampai) ? sampai : today;
  if (from > to) [from, to] = [to, from];
  if (from < addDays(to, -366)) from = addDays(to, -366);
  return { from, to };
}
