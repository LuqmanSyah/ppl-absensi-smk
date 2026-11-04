"use server";

// Check-in dan check-out siswa (FR-05 sampai FR-09, FR-17, NFR-03, NFR-06).
// Semua keputusan diambil di server memakai waktu server; data dari browser hanya
// token QR dan posisi GPS, dan keduanya divalidasi ulang di sini.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { config } from "@/lib/config";
import { formatTime } from "@/lib/time";
import { checkLocation } from "@/lib/attendance/geo";
import { attendanceStatus } from "@/lib/attendance/rules";
import { getActiveLocation, isSessionOpen } from "@/lib/attendance/server";

const inputSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{20,100}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().max(100_000),
  mode: z.enum(["auto", "checkout"]),
});

export type AttendanceInput = z.infer<typeof inputSchema>;

export type ErrorCode =
  | "INVALID_INPUT"
  | "INVALID_QR"
  | "SESSION_ENDED"
  | "WRONG_CLASS"
  | "NO_LOCATION"
  | "ACCURACY"
  | "OUTSIDE"
  | "ALREADY_CHECKED_OUT";

export type AttendanceResult =
  | { kind: "checked_in"; status: "HADIR" | "TERLAMBAT"; time: string; subject: string; className: string }
  | { kind: "already_checked_in"; status: "HADIR" | "TERLAMBAT"; time: string; subject: string }
  | { kind: "confirm_checkout"; checkInTime: string; subject: string }
  | { kind: "checked_out"; time: string; subject: string }
  | { kind: "error"; code: ErrorCode; message: string; retry: "location" | "scan" | "none" };

function fail(code: ErrorCode, message: string, retry: "location" | "scan" | "none"): AttendanceResult {
  return { kind: "error", code, message, retry };
}

export async function submitAttendance(raw: AttendanceInput): Promise<AttendanceResult> {
  const user = await requireRole("STUDENT");
  const now = new Date(); // waktu server, bukan waktu perangkat siswa (NFR-03)

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return fail("INVALID_INPUT", "Data absensi tidak lengkap. Scan ulang QR Code.", "scan");
  const input = parsed.data;

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    select: { id: true, className: true },
  });
  if (!student) return fail("INVALID_INPUT", "Data siswa tidak ditemukan.", "none");

  const reject = async (code: ErrorCode, message: string, retry: "location" | "scan" | "none", detail: Prisma.InputJsonObject = {}) => {
    // Disimpan sebagai jejak untuk menelusuri kecurangan (misalnya fake GPS). Koordinat asli
    // sengaja tidak disimpan karena data lokasi siswa di bawah umur bersifat sensitif.
    await logAudit({ userId: user.id, action: "ATTENDANCE_REJECTED", entity: "attendance_sessions", detail: { code, ...detail } });
    return fail(code, message, retry);
  };

  // 1. Token QR dan sesi
  const session = await prisma.attendanceSession.findUnique({
    where: { qrToken: input.token },
    include: { schedule: true },
  });
  if (!session) return reject("INVALID_QR", "QR Code tidak dikenali. Pastikan Anda memindai QR dari layar guru.", "scan");
  const sessionInfo = { sessionId: session.id };

  // 2. Kelas siswa harus sama dengan kelas pada jadwal
  if (session.schedule.className !== student.className) {
    return reject("WRONG_CLASS", `QR Code ini untuk kelas ${session.schedule.className}, sedangkan Anda terdaftar di ${student.className}.`, "none", sessionInfo);
  }

  // 3. Sesi masih berlaku (dicek terhadap waktu server)
  if (!isSessionOpen(session, now)) {
    return reject("SESSION_ENDED", "Sesi absensi ini sudah ditutup atau kedaluwarsa. Hubungi guru Anda.", "none", sessionInfo);
  }

  // 4. Lokasi: akurasi lalu radius (geofencing)
  const school = await getActiveLocation();
  if (!school) return fail("NO_LOCATION", "Lokasi sekolah belum diatur. Hubungi Admin TU.", "none");

  const location = checkLocation(
    { latitude: input.latitude, longitude: input.longitude, accuracyM: input.accuracy },
    { latitude: Number(school.latitude), longitude: Number(school.longitude), radiusM: school.radiusM },
    config.maxGpsAccuracyM,
  );
  if (!location.ok) {
    if (location.reason === "ACCURACY") {
      return reject(
        "ACCURACY",
        `Sinyal GPS kurang akurat (sekitar ${Math.round(location.accuracyM)} m, maksimal ${location.maxAccuracyM} m). Aktifkan GPS/lokasi akurat, pindah ke dekat jendela atau tempat terbuka, lalu coba lagi.`,
        "location",
        { ...sessionInfo, accuracyM: Math.round(location.accuracyM) },
      );
    }
    return reject(
      "OUTSIDE",
      `Anda berada di luar area sekolah (sekitar ${Math.round(location.distanceM)} m dari titik sekolah, batas ${location.radiusM} m). Absensi hanya bisa dilakukan di sekolah.`,
      "location",
      { ...sessionInfo, distanceM: Math.round(location.distanceM), accuracyM: Math.round(input.accuracy) },
    );
  }

  const eventData = {
    latitude: input.latitude.toFixed(7),
    longitude: input.longitude.toFixed(7),
    accuracyM: input.accuracy,
    distanceM: location.distanceM,
    insideRadius: true,
    recordedAt: now,
  };
  const tz = config.timezone;
  const subject = `${session.schedule.subject} (${session.schedule.className})`;

  // 5. Sudah pernah absen di sesi ini?
  const existing = await prisma.attendance.findUnique({
    where: { sessionId_studentId: { sessionId: session.id, studentId: student.id } },
  });

  if (existing) {
    if (existing.checkOutAt) {
      return fail("ALREADY_CHECKED_OUT", `Anda sudah absen pulang pukul ${formatTime(existing.checkOutAt, tz)} di sesi ini.`, "none");
    }
    // Scan kedua tidak langsung dianggap pulang, agar scan ganda tidak sengaja tidak mengakhiri kehadiran.
    if (input.mode !== "checkout") {
      return { kind: "confirm_checkout", checkInTime: formatTime(existing.checkInAt!, tz), subject };
    }
    await prisma.$transaction([
      prisma.attendance.update({ where: { id: existing.id }, data: { checkOutAt: now } }),
      prisma.attendanceEvent.create({ data: { ...eventData, attendanceId: existing.id, eventType: "CHECK_OUT" } }),
    ]);
    await logAudit({ userId: user.id, action: "ATTENDANCE_CHECK_OUT", entity: "attendance", entityId: existing.id });
    revalidatePath("/siswa", "layout");
    return { kind: "checked_out", time: formatTime(now, tz), subject };
  }

  if (input.mode === "checkout") {
    return fail("INVALID_INPUT", "Anda belum absen masuk di sesi ini.", "scan");
  }

  // 6. Simpan check-in dan tentukan status Hadir/Terlambat
  const status = attendanceStatus(session.openedAt, now, config.lateAfterMinutes);
  try {
    const attendance = await prisma.attendance.create({
      data: {
        sessionId: session.id,
        studentId: student.id,
        checkInAt: now,
        status,
        events: { create: { ...eventData, eventType: "CHECK_IN" } },
      },
    });
    await logAudit({
      userId: user.id,
      action: "ATTENDANCE_CHECK_IN",
      entity: "attendance",
      entityId: attendance.id,
      detail: { sessionId: session.id, status, distanceM: Math.round(location.distanceM) },
    });
  } catch (error) {
    // Dua permintaan bersamaan (misalnya tombol ditekan dua kali): constraint unik menolak yang kedua.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const again = await prisma.attendance.findUniqueOrThrow({
        where: { sessionId_studentId: { sessionId: session.id, studentId: student.id } },
      });
      return { kind: "already_checked_in", status: again.status, time: formatTime(again.checkInAt!, tz), subject };
    }
    throw error;
  }

  revalidatePath("/siswa", "layout");
  return { kind: "checked_in", status, time: formatTime(now, tz), subject, className: session.schedule.className };
}
