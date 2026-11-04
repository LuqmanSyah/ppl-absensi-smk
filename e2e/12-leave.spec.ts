// Pengajuan izin/sakit dan konfirmasi Admin TU (S2-09, FR-11).
import { expect, test, type Page } from "@playwright/test";
import { E2E_STUDENTS, db, ensureLiveSchedule, field, jakartaNow, login, loginAdmin, logout, tooCloseToMidnight } from "./helpers";

test.skip(tooCloseToMidnight(), "Tes ini memakai tanggal hari ini; jalankan di luar 22:50-00:20 WIB.");
test.describe.configure({ mode: "serial" });

const SICK_STUDENT = E2E_STUDENTS[1]; // Siswa E2E 2, tidak hadir di 11-attendance
const OTHER_STUDENT = E2E_STUDENTS[6]; // Siswa E2E 7
let sessionId: number;

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function submitLeave(page: Page, v: { type: string; from: string; to: string; reason: string }) {
  await page.goto("/siswa/izin");
  await field(page, "Jenis").selectOption({ label: v.type });
  await field(page, "Dari tanggal").fill(v.from);
  await field(page, "Sampai tanggal").fill(v.to);
  await field(page, "Alasan").fill(v.reason);
  await page.getByRole("button", { name: "Kirim pengajuan" }).click();
}

test.beforeAll(async () => {
  const scheduleId = await ensureLiveSchedule();
  await db(
    `DELETE FROM leave_requests WHERE student_id IN (SELECT id FROM students WHERE nis = ANY($1::text[]))`,
    [[SICK_STUDENT, OTHER_STUDENT]],
  );
  // Pastikan ada sesi aktif hari ini untuk jadwal uji (bisa sudah dibuat oleh 11-attendance).
  const open = await db<{ id: number }>(
    "SELECT id FROM attendance_sessions WHERE schedule_id = $1 AND status = 'ACTIVE' AND expires_at > now() ORDER BY opened_at DESC LIMIT 1",
    [scheduleId],
  );
  if (open.length) {
    sessionId = open[0].id;
  } else {
    const [row] = await db<{ id: number }>(
      `INSERT INTO attendance_sessions (teacher_id, schedule_id, qr_token, opened_at, expires_at)
       SELECT teacher_id, id, md5(random()::text) || md5(random()::text), now(), now() + interval '1 hour' FROM schedules WHERE id = $1
       RETURNING id`,
      [scheduleId],
    );
    sessionId = row.id;
  }
});

test("I2-01 isian tidak valid ditolak", async ({ page }) => {
  const today = jakartaNow().date;
  await login(page, SICK_STUDENT, undefined, "/siswa");
  await submitLeave(page, { type: "Sakit", from: today, to: shiftDate(today, -1), reason: "demam" });
  await expect(page.getByText("Tuliskan alasan minimal 10 karakter.")).toBeVisible();
  await expect(page.getByText("Tanggal selesai tidak boleh sebelum tanggal mulai.")).toBeVisible();
  await expect(field(page, "Alasan")).toHaveValue("demam");

  await submitLeave(page, { type: "Sakit", from: shiftDate(today, -10), to: shiftDate(today, -10), reason: "Sakit minggu lalu, lupa lapor" });
  await expect(page.getByText(/paling lambat 7 hari/)).toBeVisible();
});

test("I2-02 siswa mengajukan sakit; pengajuan bertabrakan ditolak", async ({ page }) => {
  const today = jakartaNow().date;
  await login(page, SICK_STUDENT, undefined, "/siswa");
  await submitLeave(page, { type: "Sakit", from: today, to: today, reason: "Demam tinggi sejak semalam, surat dokter menyusul." });
  await expect(page.getByText("Pengajuan terkirim dan menunggu konfirmasi Admin TU.")).toBeVisible();
  await expect(page.getByTestId("leave-item").first()).toContainText("Sakit");
  await expect(page.getByTestId("leave-item").first()).toContainText("Menunggu");
  await expect(field(page, "Alasan")).toHaveValue(""); // form dikosongkan setelah berhasil

  await submitLeave(page, { type: "Izin", from: today, to: shiftDate(today, 1), reason: "Acara keluarga di luar kota." });
  await expect(page.getByText(/Sudah ada pengajuan lain/)).toBeVisible();
});

test("I2-03 daftar hadir guru menampilkan izin yang masih menunggu", async ({ page }) => {
  await login(page, "guru1", undefined, "/guru");
  await page.goto(`/guru/sesi/${sessionId}`);
  await expect(page.getByRole("row", { name: /Siswa E2E 2/ })).toContainText("Izin menunggu");
});

test("I2-04 admin menyetujui pengajuan", async ({ page }) => {
  await loginAdmin(page);
  await expect(page.getByRole("link", { name: /Izin menunggu\s*1/ })).toBeVisible();
  await page.getByRole("link", { name: /Izin menunggu/ }).click();
  await expect(page).toHaveURL("/admin/izin");

  const row = page.getByRole("row", { name: /Siswa E2E 2/ });
  await expect(row).toContainText("Demam tinggi");
  await row.getByRole("button", { name: "Setujui" }).click();
  // Setelah diproses, baris langsung hilang dari tab Menunggu.
  await expect(page.getByRole("row", { name: /Siswa E2E 2/ })).toHaveCount(0);
  await page.getByRole("link", { name: "Disetujui" }).click();
  await expect(page.getByRole("row", { name: /Siswa E2E 2/ })).toContainText("Disetujui");

  const [leave] = await db<{ reviewed_by: number | null }>(
    "SELECT reviewed_by FROM leave_requests l JOIN students s ON s.id = l.student_id WHERE s.nis = $1",
    [SICK_STUDENT],
  );
  expect(leave.reviewed_by).not.toBeNull();
});

test("I2-05 status disetujui terlihat oleh siswa dan guru", async ({ page }) => {
  await login(page, SICK_STUDENT, undefined, "/siswa");
  await page.goto("/siswa/izin");
  await expect(page.getByTestId("leave-item").first()).toContainText("Disetujui");
  await expect(page.getByRole("button", { name: "Batalkan" })).toHaveCount(0);
  await logout(page);

  await login(page, "guru1", undefined, "/guru");
  await page.goto(`/guru/sesi/${sessionId}`);
  await expect(page.getByRole("row", { name: /Siswa E2E 2/ })).toContainText("Sakit");
  await expect(page.getByTestId("roster-summary")).toContainText("Izin/Sakit: 1");
});

test("I2-06 siswa membatalkan pengajuan, admin menolak pengajuan lain", async ({ page }) => {
  const tomorrow = shiftDate(jakartaNow().date, 1);
  await login(page, OTHER_STUDENT, undefined, "/siswa");
  await submitLeave(page, { type: "Izin", from: tomorrow, to: tomorrow, reason: "Mengurus dokumen kependudukan." });
  await expect(page.getByText("Pengajuan terkirim")).toBeVisible();
  await page.getByRole("button", { name: "Batalkan" }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(page.getByTestId("leave-item")).toHaveCount(0);

  await submitLeave(page, { type: "Izin", from: tomorrow, to: tomorrow, reason: "Menghadiri pernikahan saudara." });
  await expect(page.getByText("Pengajuan terkirim")).toBeVisible();
  await logout(page);

  await loginAdmin(page);
  await page.goto("/admin/izin");
  const row = page.getByRole("row", { name: /Siswa E2E 7/ });
  await row.getByRole("button", { name: "Tolak" }).click();
  await row.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(page.getByRole("row", { name: /Siswa E2E 7/ })).toHaveCount(0);
  await logout(page);

  await login(page, OTHER_STUDENT, undefined, "/siswa");
  await page.goto("/siswa/izin");
  await expect(page.getByTestId("leave-item").first()).toContainText("Ditolak");
});
