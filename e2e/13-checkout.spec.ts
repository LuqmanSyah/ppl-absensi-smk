// Absen selesai pelajaran (pengganti pemantauan lokasi berkala, FR-09/FR-10).
// Aturan: dibuka setelah 2/3 pelajaran berlalu dihitung dari jam mulai jadwal, ditutup 10 menit
// setelah jam selesai, dan divalidasi lokasi GPS seperti absen masuk.
import { expect, test, type Browser, type Page } from "@playwright/test";
import { SCHOOL, db, ensureLiveSchedule, login, setLessonWindow, tooCloseToMidnight } from "./helpers";

test.skip(tooCloseToMidnight(), "Tes absen selesai butuh jam pelajaran di hari yang sama.");
test.describe.configure({ mode: "serial" });

const CLASS = "XII SELESAI";
const STUDENTS = ["9930001", "9930002", "9930003", "9930004"];
let scheduleId: number;
let sessionId: number;
let token: string;

async function student(browser: Browser, nis: string, position = { ...SCHOOL, accuracy: 10 }): Promise<Page> {
  const context = await browser.newContext({ geolocation: position, permissions: ["geolocation"], locale: "id-ID", timezoneId: "Asia/Jakarta" });
  const page = await context.newPage();
  await login(page, nis, undefined, "/siswa");
  return page;
}
const status = (page: Page) => page.getByTestId("attendance-status");

test.beforeAll(async () => {
  scheduleId = await ensureLiveSchedule(CLASS, "Uji Selesai", STUDENTS, "Selesai");
  await db("DELETE FROM attendance_events WHERE attendance_id IN (SELECT a.id FROM attendance a JOIN attendance_sessions s ON s.id = a.session_id WHERE s.schedule_id = $1)", [scheduleId]);
  await db("DELETE FROM attendance WHERE session_id IN (SELECT id FROM attendance_sessions WHERE schedule_id = $1)", [scheduleId]);
  await db("DELETE FROM attendance_sessions WHERE schedule_id = $1", [scheduleId]);
  // Pelajaran 30 menit: mulai 5 menit lalu, selesai 25 menit lagi -> absen selesai dibuka 15 menit lagi.
  await setLessonWindow(scheduleId, -5, 25);
  const [row] = await db<{ id: number; qr_token: string }>(
    `INSERT INTO attendance_sessions (teacher_id, schedule_id, qr_token, opened_at, expires_at)
     SELECT teacher_id, id, md5(random()::text) || md5(random()::text), now(), now() + interval '2 hours'
     FROM schedules WHERE id = $1 RETURNING id, qr_token`,
    [scheduleId],
  );
  sessionId = row.id;
  token = row.qr_token;
});

test("C-01 absen masuk menampilkan jam absen selesai; scan lagi terlalu cepat ditolak dengan jamnya", async ({ browser }) => {
  for (const nis of STUDENTS.slice(0, 3)) {
    const page = await student(browser, nis);
    await page.goto(`/siswa/absen?t=${token}`);
    await expect(status(page)).toContainText("Absen masuk berhasil");
  }
  const page = await student(browser, STUDENTS[0]);
  await expect(page.getByTestId("lesson-checkout")).toContainText("Absen selesai mulai");
  await page.goto(`/siswa/absen?t=${token}`);
  await expect(status(page)).toContainText("Belum waktunya absen selesai");
});

test("C-02 setelah 2/3 pelajaran: absen selesai tetap divalidasi lokasi", async ({ browser }) => {
  // Pelajaran 30 menit: mulai 25 menit lalu, selesai 5 menit lagi -> menit ke-20 sudah lewat.
  await setLessonWindow(scheduleId, -25, 5);

  const outside = await student(browser, STUDENTS[0], { latitude: SCHOOL.latitude + 0.004, longitude: SCHOOL.longitude, accuracy: 10 });
  // Lokasi diperiksa sebelum konfirmasi: dari luar sekolah langsung ditolak.
  await outside.goto(`/siswa/absen?t=${token}`);
  await expect(status(outside)).toContainText("di luar area sekolah");

  await outside.context().setGeolocation({ ...SCHOOL, accuracy: 10 });
  await outside.getByRole("button", { name: "Coba lagi" }).click();
  await expect(status(outside)).toContainText("Absen selesai pelajaran");
  await outside.getByRole("button", { name: "Ya, absen selesai" }).click();
  await expect(status(outside)).toContainText("Absen selesai berhasil");

  const [event] = await db<{ inside_radius: boolean }>(
    `SELECT e.inside_radius FROM attendance_events e JOIN attendance a ON a.id = e.attendance_id
     JOIN students s ON s.id = a.student_id WHERE s.nis = $1 AND e.event_type = 'CHECK_OUT'`,
    [STUDENTS[0]],
  );
  expect(event.inside_radius).toBe(true);
});

test("C-03 setelah jam selesai: absen masuk ditutup, absen selesai masih bisa dalam 10 menit", async ({ browser }) => {
  // Selesai 3 menit lalu (masih dalam waktu tambahan 10 menit).
  await setLessonWindow(scheduleId, -33, -3);

  const late = await student(browser, STUDENTS[3]);
  await late.goto(`/siswa/absen?t=${token}`);
  await expect(status(late)).toContainText("absen masuk ditutup");

  const page = await student(browser, STUDENTS[1]);
  await page.goto(`/siswa/absen?t=${token}`);
  await page.getByRole("button", { name: "Ya, absen selesai" }).click();
  await expect(status(page)).toContainText("Absen selesai berhasil");
});

test("C-04 lewat waktu tambahan: absen selesai ditolak", async ({ browser }) => {
  // Selesai 15 menit lalu.
  await setLessonWindow(scheduleId, -45, -15);
  const page = await student(browser, STUDENTS[2]);
  await page.goto(`/siswa/absen?t=${token}`);
  await expect(status(page)).toContainText("Waktu absen selesai sudah lewat");
});

test("C-05 yang tidak absen selesai ditandai di daftar hadir, dashboard, laporan, dan halaman siswa", async ({ browser, page }) => {
  await db("UPDATE attendance_sessions SET status = 'CLOSED' WHERE id = $1", [sessionId]);

  await login(page, "guru1", undefined, "/guru");
  await page.goto(`/guru/sesi/${sessionId}`);
  await expect(page.getByTestId("roster-summary")).toContainText("Absen selesai: 2/3");
  await expect(page.getByTestId("checkout-alert")).toContainText("1 siswa hadir tetapi tidak absen selesai");
  await expect(page.getByRole("row", { name: /Selesai 3/ })).toContainText("Tidak absen selesai");
  await expect(page.getByRole("row", { name: /Selesai 1/ })).not.toContainText("Tidak absen selesai");

  const admin = await (await browser.newContext()).newPage();
  await login(admin, "admin", undefined, "/admin");
  await expect(admin.getByRole("row", { name: /Uji Selesai/ })).toContainText("1 tidak absen selesai");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  await admin.goto(`/admin/laporan?kelas=${encodeURIComponent(CLASS)}&dari=${today}&sampai=${today}`);
  const row = admin.getByRole("row", { name: /Selesai 3/ });
  await expect(row).toBeVisible();
  // Tetap dihitung hadir (persentase 100%), dengan keterangan 1 kali tidak absen selesai.
  expect((await row.getByRole("cell").allTextContents()).slice(2)).toEqual(["1", "0", "0", "0", "0", "1", "100%"]);

  const s3 = await student(browser, STUDENTS[2]);
  await expect(s3.getByTestId("lesson-checkout")).toContainText("Tidak absen selesai");
});
