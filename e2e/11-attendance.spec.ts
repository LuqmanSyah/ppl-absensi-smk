// Absensi QR Code + GPS (Sprint 2). Nomor uji mengacu ke docs/testing-sprint-2.md.
import { expect, test, type Browser } from "@playwright/test";
import {
  E2E_STUDENTS,
  SCHOOL,
  db,
  ensureLiveSchedule,
  latestSessionToken,
  login,
  setLessonWindow,
  tooCloseToMidnight,
} from "./helpers";

test.skip(tooCloseToMidnight(), "Tes absensi butuh jam pelajaran di hari yang sama; jalankan di luar 22:50-00:20 WIB.");
test.describe.configure({ mode: "serial" });

let scheduleId: number;
let token: string;

/** Membuka halaman siswa dengan posisi GPS tertentu. */
async function studentPage(browser: Browser, nis: string, position = { ...SCHOOL, accuracy: 10 }, grant = true) {
  const context = await browser.newContext({
    geolocation: position,
    permissions: grant ? ["geolocation"] : [],
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
  });
  const page = await context.newPage();
  await login(page, nis, undefined, "/siswa");
  return page;
}

const status = (page: import("@playwright/test").Page) => page.getByTestId("attendance-status");

test.beforeAll(async () => {
  scheduleId = await ensureLiveSchedule();
  // Mulai dari keadaan bersih jika tes diulang.
  await db("DELETE FROM attendance_events WHERE attendance_id IN (SELECT a.id FROM attendance a JOIN attendance_sessions s ON s.id = a.session_id WHERE s.schedule_id = $1)", [scheduleId]);
  await db("DELETE FROM attendance WHERE session_id IN (SELECT id FROM attendance_sessions WHERE schedule_id = $1)", [scheduleId]);
  await db("DELETE FROM attendance_sessions WHERE schedule_id = $1", [scheduleId]);
});

test("G-01 guru membuka sesi dan QR tampil", async ({ page }) => {
  await login(page, "guru1", undefined, "/guru");
  const card = page.locator("[data-slot=card]", { hasText: "Uji Absensi" });
  await card.getByRole("button", { name: "Buka sesi absensi" }).click();
  await expect(page).toHaveURL(/\/guru\/sesi\/\d+$/);
  await expect(page.getByTestId("session-qr")).toBeVisible();
  await expect(page.getByTestId("roster-summary")).toContainText(`Belum absen: ${E2E_STUDENTS.length}`);

  token = (await latestSessionToken(scheduleId)).qr_token;
  expect(token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
});

test("G-02 guru tidak bisa membuka sesi untuk jadwal yang sudah selesai", async ({ page }) => {
  // Jadwal guru1 lain hari ini yang sudah lewat
  const { weekday } = await import("./helpers").then((h) => h.jakartaNow());
  await db(
    `INSERT INTO schedules (teacher_id, class_name, subject, day, start_time, end_time)
     SELECT t.id, 'XII E2E LAMA', 'Sudah Selesai', $1, '00:00', '00:10' FROM teachers t JOIN users u ON u.id = t.user_id
     WHERE u.username = 'guru1' AND NOT EXISTS (SELECT 1 FROM schedules WHERE subject = 'Sudah Selesai')`,
    [weekday],
  );
  await db("UPDATE schedules SET day = $1 WHERE subject = 'Sudah Selesai'", [weekday]);
  await login(page, "guru1", undefined, "/guru");
  const card = page.locator("[data-slot=card]", { hasText: "Sudah Selesai" });
  await expect(card).toContainText("Jam pelajaran sudah selesai.");
  await expect(card.getByRole("button", { name: /Buka sesi/ })).toHaveCount(0);
});

test("S-01 siswa di dalam radius berhasil absen (Hadir) dan guru melihatnya tanpa reload", async ({ browser }) => {
  const teacher = await (await browser.newContext()).newPage();
  await login(teacher, "guru1", undefined, "/guru");
  const { id } = await latestSessionToken(scheduleId);
  await teacher.goto(`/guru/sesi/${id}`);

  const page = await studentPage(browser, E2E_STUDENTS[0]);
  await page.goto(`/siswa/absen?t=${token}`);
  await expect(status(page)).toContainText("Absen masuk berhasil");
  await expect(status(page)).toContainText("Status: Hadir");
  await expect(status(page)).toContainText("Jangan lupa absen selesai mulai pukul");
  await expect(page).toHaveURL("/siswa/absen"); // token dihapus dari alamat

  // Daftar guru diperbarui otomatis (polling 10 detik).
  await expect(teacher.getByTestId("roster-summary")).toContainText("Hadir: 1", { timeout: 20_000 });
  await expect(teacher.getByRole("row", { name: /Siswa E2E 1/ })).toContainText("Hadir");

  const [event] = await db<{ event_type: string; inside_radius: boolean; distance_m: number }>(
    `SELECT e.event_type, e.inside_radius, e.distance_m FROM attendance_events e
     JOIN attendance a ON a.id = e.attendance_id JOIN students s ON s.id = a.student_id WHERE s.nis = $1
     ORDER BY e.recorded_at ASC LIMIT 1`,
    [E2E_STUDENTS[0]],
  );
  expect(event).toMatchObject({ event_type: "CHECK_IN", inside_radius: true });
  expect(event.distance_m).toBeLessThan(5);
});

test("S-02 absen selesai baru bisa setelah 2/3 pelajaran, lalu berhasil", async ({ browser }) => {
  const page = await studentPage(browser, E2E_STUDENTS[0]);
  // Jadwal: mulai 10 menit lalu, selesai 60 menit lagi -> absen selesai belum dibuka.
  await page.goto(`/siswa/absen?t=${token}`);
  await expect(status(page)).toContainText("Belum waktunya absen selesai");
  await expect(status(page)).toContainText(/mulai pukul \d{2}:\d{2}/);

  // Geser jadwal: mulai 60 menit lalu, selesai 10 menit lagi -> 2/3 pelajaran sudah lewat.
  await setLessonWindow(scheduleId, -60, 10);
  await page.goto(`/siswa/absen?t=${token}`);
  await expect(status(page)).toContainText("Absen selesai pelajaran");
  await page.getByRole("button", { name: "Ya, absen selesai" }).click();
  await expect(status(page)).toContainText("Absen selesai berhasil");

  await page.goto(`/siswa/absen?t=${token}`);
  await expect(status(page)).toContainText("sudah absen selesai");

  const [row] = await db<{ check_out_at: Date | null }>(
    "SELECT a.check_out_at FROM attendance a JOIN students s ON s.id = a.student_id WHERE s.nis = $1",
    [E2E_STUDENTS[0]],
  );
  expect(row.check_out_at).not.toBeNull();
});

test("S-03 di luar radius ditolak dengan jaraknya, tidak ada data tersimpan", async ({ browser }) => {
  const page = await studentPage(browser, E2E_STUDENTS[1], { latitude: SCHOOL.latitude + 0.003, longitude: SCHOOL.longitude, accuracy: 10 });
  await page.goto(`/siswa/absen?t=${token}`);
  await expect(status(page)).toContainText("Absensi ditolak");
  await expect(status(page)).toContainText(/di luar area sekolah \(sekitar 3\d\d m/);
  await expect(page.getByRole("button", { name: "Coba lagi" })).toBeVisible();

  const rows = await db("SELECT a.id FROM attendance a JOIN students s ON s.id = a.student_id WHERE s.nis = $1", [E2E_STUDENTS[1]]);
  expect(rows).toHaveLength(0);
  const [audit] = await db<{ detail: { code: string; distanceM: number } }>(
    `SELECT detail FROM audit_logs a JOIN users u ON u.id = a.user_id WHERE u.username = $1 AND action = 'ATTENDANCE_REJECTED' ORDER BY a.id DESC LIMIT 1`,
    [E2E_STUDENTS[1]],
  );
  expect(audit.detail.code).toBe("OUTSIDE");
  expect(JSON.stringify(audit.detail)).not.toContain("106.8"); // koordinat siswa tidak disimpan
});

test("S-04 akurasi GPS buruk ditolak, lalu berhasil setelah sinyal membaik", async ({ browser }) => {
  const page = await studentPage(browser, E2E_STUDENTS[2], { ...SCHOOL, accuracy: 150 });
  await page.goto(`/siswa/absen?t=${token}`);
  await expect(status(page)).toContainText("Sinyal GPS kurang akurat (sekitar 150 m, maksimal 50 m)");

  await page.context().setGeolocation({ ...SCHOOL, accuracy: 15 });
  await page.getByRole("button", { name: "Coba lagi" }).click();
  await expect(status(page)).toContainText("Absen masuk berhasil");
});

test("S-05 absen lebih dari 5 menit setelah sesi dibuka tercatat Terlambat", async ({ browser }) => {
  const { id } = await latestSessionToken(scheduleId);
  await db("UPDATE attendance_sessions SET opened_at = now() - interval '6 minutes' WHERE id = $1", [id]);
  const page = await studentPage(browser, E2E_STUDENTS[3]);
  await page.goto(`/siswa/absen?t=${token}`);
  await expect(status(page)).toContainText("Status: Terlambat");
});

test("S-06 jam HP diubah tidak berpengaruh: waktu dari server", async ({ browser }) => {
  const page = await studentPage(browser, E2E_STUDENTS[4]);
  await page.clock.setFixedTime(new Date("2030-01-01T01:00:00Z"));
  await page.goto(`/siswa/absen?t=${token}`);
  await expect(status(page)).toContainText("Absen masuk berhasil");
  const [row] = await db<{ diff: number }>(
    "SELECT abs(extract(epoch FROM (now() - a.check_in_at))) AS diff FROM attendance a JOIN students s ON s.id = a.student_id WHERE s.nis = $1",
    [E2E_STUDENTS[4]],
  );
  expect(Number(row.diff)).toBeLessThan(120);
});

test("S-07 koneksi putus saat mengirim: pesan jelas dan bisa dicoba lagi", async ({ browser }) => {
  const page = await studentPage(browser, E2E_STUDENTS[5]);
  // Gagalkan permintaan Server Action pertama seolah koneksi terputus.
  let blocked = false;
  await page.route("**/siswa/absen**", async (route) => {
    if (!blocked && route.request().method() === "POST") {
      blocked = true;
      return route.abort("internetdisconnected");
    }
    return route.continue();
  });
  await page.goto(`/siswa/absen?t=${token}`);
  await expect(status(page)).toContainText("Absensi gagal terkirim");
  await expect(status(page)).toContainText("belum tercatat");
  await page.getByRole("button", { name: "Coba lagi" }).click();
  await expect(status(page)).toContainText("Absen masuk berhasil");
});

test("S-08 QR untuk kelas lain ditolak", async ({ browser }) => {
  const page = await studentPage(browser, "2024001"); // kelas XI RPL 1
  await page.goto(`/siswa/absen?t=${token}`);
  await expect(status(page)).toContainText("QR Code ini untuk kelas XII E2E");
});

test("S-09 QR palsu ditolak", async ({ browser }) => {
  const page = await studentPage(browser, E2E_STUDENTS[6]);
  await page.goto(`/siswa/absen?t=${"A".repeat(43)}`);
  await expect(status(page)).toContainText("QR Code tidak dikenali");
  await expect(page.getByRole("button", { name: "Scan ulang" })).toBeVisible();
});

test("S-10 izin lokasi ditolak browser memberi petunjuk", async ({ browser }) => {
  const page = await studentPage(browser, E2E_STUDENTS[6], { ...SCHOOL, accuracy: 10 }, false);
  await page.goto(`/siswa/absen?t=${token}`);
  await expect(status(page)).toContainText("Lokasi tidak terbaca");
  await expect(status(page)).toContainText("Izin lokasi ditolak");
});

test("G-03 daftar hadir guru menampilkan semua status", async ({ page }) => {
  await login(page, "guru1", undefined, "/guru");
  const { id } = await latestSessionToken(scheduleId);
  await page.goto(`/guru/sesi/${id}`);
  // Siswa 1 dan 3 Hadir; siswa 4-6 absen setelah waktu buka sesi digeser 6 menit (S-05), jadi Terlambat.
  await expect(page.getByTestId("roster-summary")).toContainText("Hadir: 2");
  await expect(page.getByTestId("roster-summary")).toContainText("Terlambat: 3");
  await expect(page.getByTestId("roster-summary")).toContainText("Belum absen: 2");
  await expect(page.getByRole("row", { name: /Siswa E2E 4/ })).toContainText("Terlambat");
  await expect(page.getByRole("row", { name: /Siswa E2E 2/ })).toContainText("Belum absen");
});

test("G-04 guru menutup sesi, QR tidak bisa dipakai lagi", async ({ page, browser }) => {
  await login(page, "guru1", undefined, "/guru");
  const { id } = await latestSessionToken(scheduleId);
  await page.goto(`/guru/sesi/${id}`);
  await page.getByRole("button", { name: "Tutup sesi" }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  // Halaman langsung diperbarui: QR hilang dan status berubah menjadi Berakhir.
  await expect(page.getByTestId("session-qr")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Berakhir");
  await expect(page.getByRole("row", { name: /Siswa E2E 2/ })).toContainText("Tidak hadir");
  // Siswa 3-6 hadir tetapi tidak absen selesai sebelum sesi ditutup.
  await expect(page.getByTestId("checkout-alert")).toContainText("4 siswa hadir tetapi tidak absen selesai");
  await expect(page.getByRole("row", { name: /Siswa E2E 3/ })).toContainText("Tidak absen selesai");
  await expect(page.getByRole("row", { name: /Siswa E2E 1/ })).not.toContainText("Tidak absen selesai");

  const student = await studentPage(browser, E2E_STUDENTS[1]);
  await student.goto(`/siswa/absen?t=${token}`);
  await expect(status(student)).toContainText("sudah ditutup atau kedaluwarsa");
});

test("S-11 riwayat dan beranda siswa menampilkan kehadiran", async ({ browser }) => {
  const page = await studentPage(browser, E2E_STUDENTS[0]);
  await expect(page.locator("[data-slot=card]", { hasText: "Uji Absensi" })).toContainText("Hadir");
  await page.getByRole("link", { name: "Riwayat" }).filter({ visible: true }).click();
  await expect(page.getByTestId("history-summary")).toContainText("1 hadir");
  await expect(page.getByText("Uji Absensi").filter({ visible: true })).toBeVisible();
});

test("G-05 sesi bisa dibuka lagi di hari yang sama dengan QR yang sama", async ({ page }) => {
  await login(page, "guru1", undefined, "/guru");
  const card = page.locator("[data-slot=card]", { hasText: "Uji Absensi" });
  await card.getByRole("button", { name: "Buka sesi lagi" }).click();
  await expect(page.getByTestId("session-qr")).toBeVisible();
  expect((await latestSessionToken(scheduleId)).qr_token).toBe(token);
  const sessions = await db("SELECT id FROM attendance_sessions WHERE schedule_id = $1", [scheduleId]);
  expect(sessions).toHaveLength(1);
});
