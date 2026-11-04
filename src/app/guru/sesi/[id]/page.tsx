import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { BackLink } from "@/components/data-list";
import { AutoRefresh } from "@/components/attendance/auto-refresh";
import { AttendanceBadge } from "@/components/attendance/status-badge";
import { ConfirmActionButton } from "@/components/form/confirm-button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { parseId } from "@/lib/params";
import { dateToTime } from "@/lib/schedule-time";
import { formatDate, formatTime } from "@/lib/time";
import { buildAttendanceUrl } from "@/lib/attendance/rules";
import { getAppOrigin, isSessionOpen } from "@/lib/attendance/server";
import { getSessionRoster } from "@/lib/attendance/roster";
import { closeSession } from "../../actions";

export default async function SessionPage({ params }: PageProps<"/guru/sesi/[id]">) {
  const user = await requireRole("TEACHER");
  const id = parseId((await params).id);
  if (!id) notFound();

  const session = await prisma.attendanceSession.findUnique({
    where: { id },
    include: { schedule: true, teacher: { select: { userId: true } } },
  });
  // Guru hanya bisa melihat sesinya sendiri.
  if (!session || session.teacher.userId !== user.id) notFound();

  const open = isSessionOpen(session);
  const [{ rows, summary }, origin] = await Promise.all([getSessionRoster(session), getAppOrigin()]);
  const qrUrl = buildAttendanceUrl(origin, session.qrToken);
  const qrImage = open ? await QRCode.toDataURL(qrUrl, { width: 640, margin: 1, errorCorrectionLevel: "M" }) : null;
  const tz = config.timezone;

  return (
    <div className="flex flex-col gap-6">
      {open && <AutoRefresh seconds={10} />}
      <div>
        <BackLink href="/guru" label="Beranda" />
        <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
          {session.schedule.subject} · {session.schedule.className}
          {open ? <Badge>Aktif</Badge> : <Badge variant="secondary">Berakhir</Badge>}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(session.openedAt, tz)} · {dateToTime(session.schedule.startTime)}-{dateToTime(session.schedule.endTime)} · dibuka{" "}
          {formatTime(session.openedAt, tz)}
        </p>
      </div>

      {open && qrImage && (
        <section className="flex flex-col items-center gap-3 rounded-xl border p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL hasil generate server */}
          <img src={qrImage} alt="QR Code absensi sesi ini" className="aspect-square w-full max-w-sm" data-testid="session-qr" />
          <p className="text-center text-sm text-muted-foreground">
            Minta siswa scan QR ini dari menu <strong>Absen</strong>. Berlaku sampai {formatTime(session.expiresAt, tz)}. Siswa yang
            absen lebih dari {config.lateAfterMinutes} menit setelah sesi dibuka tercatat Terlambat.
          </p>
          <ConfirmActionButton
            action={closeSession.bind(null, session.id)}
            label="Tutup sesi"
            confirmLabel="Tutup sesi sekarang? Siswa tidak bisa absen lagi."
            variant="destructive"
          />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Ringkasan kehadiran" data-testid="roster-summary">
          <span>Hadir: <strong>{summary.hadir}</strong></span>
          <span>Terlambat: <strong>{summary.terlambat}</strong></span>
          <span>Izin/Sakit: <strong>{summary.izin}</strong></span>
          <span>{open ? "Belum absen" : "Tidak hadir"}: <strong>{summary.belum}</strong></span>
          <span className="text-muted-foreground">dari {summary.total} siswa</span>
        </div>
        {open && <p className="text-xs text-muted-foreground">Daftar diperbarui otomatis setiap 10 detik.</p>}
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Masuk</TableHead>
                <TableHead>Pulang</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Belum ada siswa aktif di kelas {session.schedule.className}.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.studentId}>
                  <TableCell>
                    <span className="font-medium">{r.name}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{r.nis}</span>
                  </TableCell>
                  <TableCell>
                    <AttendanceBadge status={r.status} ended={!open} />
                  </TableCell>
                  <TableCell className="tabular-nums">{r.checkInAt ? formatTime(r.checkInAt, tz) : "-"}</TableCell>
                  <TableCell className="tabular-nums">{r.checkOutAt ? formatTime(r.checkOutAt, tz) : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
