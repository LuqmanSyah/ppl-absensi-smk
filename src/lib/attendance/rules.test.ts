import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { attendanceStatus, buildAttendanceUrl, extractToken, sessionWindow } from "./rules";

describe("attendanceStatus (FR-08, batas 5 menit)", () => {
  const opened = new Date("2026-11-02T00:00:00Z");
  const after = (sec: number) => new Date(opened.getTime() + sec * 1000);

  test("tepat saat dibuka: Hadir", () => assert.equal(attendanceStatus(opened, opened, 5), "HADIR"));
  test("4 menit 59 detik: Hadir", () => assert.equal(attendanceStatus(opened, after(299), 5), "HADIR"));
  test("tepat 5 menit: Hadir", () => assert.equal(attendanceStatus(opened, after(300), 5), "HADIR"));
  test("5 menit 1 detik: Terlambat", () => assert.equal(attendanceStatus(opened, after(301), 5), "TERLAMBAT"));
  test("batas bisa diatur", () => assert.equal(attendanceStatus(opened, after(301), 10), "HADIR"));
});

describe("sessionWindow (FR-03)", () => {
  // Senin 07:00-08:30
  const schedule = { day: 1, startMinutes: 420, endMinutes: 510 };

  test("hari berbeda ditolak", () => {
    assert.deepEqual(sessionWindow(schedule, { weekday: 2, minutes: 430 }, 15), { ok: false, reason: "WRONG_DAY" });
  });
  test("lebih dari 15 menit sebelum mulai ditolak", () => {
    assert.deepEqual(sessionWindow(schedule, { weekday: 1, minutes: 404 }, 15), {
      ok: false,
      reason: "TOO_EARLY",
      opensAtMinutes: 405,
    });
  });
  test("15 menit sebelum mulai boleh", () => {
    assert.equal(sessionWindow(schedule, { weekday: 1, minutes: 405 }, 15).ok, true);
  });
  test("di tengah pelajaran boleh", () => {
    assert.equal(sessionWindow(schedule, { weekday: 1, minutes: 480 }, 15).ok, true);
  });
  test("tepat saat jam selesai ditolak", () => {
    assert.deepEqual(sessionWindow(schedule, { weekday: 1, minutes: 510 }, 15), { ok: false, reason: "ENDED" });
  });
});

describe("token QR", () => {
  const token = "abcDEF123_-abcDEF123_-abcDEF123_-abcDEF123";

  test("URL QR berisi token", () => {
    assert.equal(buildAttendanceUrl("https://absen.sekolah.id/", token), `https://absen.sekolah.id/siswa/absen?t=${token}`);
  });
  test("token diambil dari URL", () => {
    assert.equal(extractToken(buildAttendanceUrl("http://localhost:3000", token)), token);
  });
  test("token mentah diterima", () => assert.equal(extractToken(`  ${token} `), token));
  test("teks lain ditolak", () => {
    assert.equal(extractToken("https://contoh.com/?x=1"), null);
    assert.equal(extractToken("halo"), null);
    assert.equal(extractToken("abc<script>"), null);
  });
});
