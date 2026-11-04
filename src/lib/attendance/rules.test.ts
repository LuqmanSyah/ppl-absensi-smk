import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { attendancePhase, attendanceStatus, buildAttendanceUrl, checkoutWindow, extractToken, sessionWindow } from "./rules";

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

describe("checkoutWindow (absen selesai setelah 2/3 pelajaran)", () => {
  test("pelajaran 45 menit: dibuka menit ke-30", () => {
    const w = checkoutWindow({ start: new Date("2026-11-02T00:00:00Z"), end: new Date("2026-11-02T00:45:00Z") }, 66.67, 10);
    assert.equal(w.opensAt.toISOString(), "2026-11-02T00:30:00.000Z");
  });
  const at = (hhmm: string) => new Date(`2026-11-02T${hhmm}:00Z`);

  test("pelajaran 30 menit: dibuka menit ke-20, ditutup 10 menit setelah selesai", () => {
    const w = checkoutWindow({ start: at("00:00"), end: at("00:30") }, 66.67, 10);
    assert.equal(w.opensAt.toISOString(), at("00:20").toISOString());
    assert.equal(w.closesAt.toISOString(), at("00:40").toISOString());
  });
  test("pelajaran 90 menit: dibuka menit ke-60", () => {
    const w = checkoutWindow({ start: at("00:00"), end: at("01:30") }, 66.67, 10);
    assert.equal(w.opensAt.toISOString(), at("01:00").toISOString());
  });
  test("persentase bisa diatur", () => {
    const w = checkoutWindow({ start: at("00:00"), end: at("01:00") }, 50, 0);
    assert.equal(w.opensAt.toISOString(), at("00:30").toISOString());
    assert.equal(w.closesAt.toISOString(), at("01:00").toISOString());
  });
});

describe("attendancePhase", () => {
  const at = (hhmm: string) => new Date(`2026-11-02T${hhmm}:00Z`);
  const lesson = { start: at("00:00"), end: at("01:30") };
  const window = { opensAt: at("01:00"), closesAt: at("01:40") };

  test("belum absen, pelajaran berjalan: boleh absen masuk", () => {
    assert.equal(attendancePhase(at("00:10"), lesson, window, false), "CHECK_IN");
  });
  test("belum absen, pelajaran sudah selesai: absen masuk ditutup", () => {
    assert.equal(attendancePhase(at("01:30"), lesson, window, false), "CLOSED");
  });
  test("sudah absen masuk, belum 2/3 pelajaran: tunggu", () => {
    assert.equal(attendancePhase(at("00:59"), lesson, window, true), "WAIT_CHECKOUT");
  });
  test("sudah absen masuk, jendela dibuka: boleh absen selesai", () => {
    assert.equal(attendancePhase(at("01:00"), lesson, window, true), "CHECKOUT");
    assert.equal(attendancePhase(at("01:40"), lesson, window, true), "CHECKOUT");
  });
  test("lewat waktu tambahan: ditutup", () => {
    assert.equal(attendancePhase(at("01:41"), lesson, window, true), "CLOSED");
  });
});
