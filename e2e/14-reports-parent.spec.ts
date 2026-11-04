// Rekap/laporan (S3-02), ekspor Excel (S3-03), dan halaman orang tua (S3-04).
// Data dibuat tetap di Oktober 2026 agar hasil yang diharapkan bisa dihitung pasti:
//
//            5 Okt        6 Okt
//  Lapor 1   Hadir        Hadir                     -> H2,          100%  (keduanya tanpa absen selesai)
//  Lapor 2   Terlambat    (sakit disetujui)         -> T1 S1,        50%  (tanpa absen selesai)
//  Lapor 3   -            - (izin masih menunggu)   -> Alpa 2,        0%
// Absen selesai hanya dicatat untuk Lapor 1 pada 6 Okt.
import ExcelJS from "exceljs";
import { expect, test } from "@playwright/test";
import { db, login, loginAdmin } from "./helpers";

test.describe.configure({ mode: "serial" });

const CLASS = "XII LAPORAN";
const NIS = ["9920001", "9920002", "9920003"];
const PERIOD = "dari=2026-10-01&sampai=2026-10-31";
let ids: number[] = [];

test.beforeAll(async () => {
  await db("DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE class_name = $1)", [CLASS]);
  await db("DELETE FROM leave_requests WHERE student_id IN (SELECT id FROM students WHERE class_name = $1)", [CLASS]);
  await db("DELETE FROM attendance_sessions WHERE schedule_id IN (SELECT id FROM schedules WHERE class_name = $1)", [CLASS]);
  await db("DELETE FROM schedules WHERE class_name = $1", [CLASS]);

  for (const [i, nis] of NIS.entries()) {
    await db(
      `INSERT INTO users (username, password_hash, role) SELECT $1::text, password_hash, 'STUDENT' FROM users WHERE username = 'admin'
       ON CONFLICT (username) DO NOTHING`,
      [nis],
    );
    await db(
      `INSERT INTO students (user_id, nis, name, class_name) SELECT id, $1::text, $2::text, $3::text FROM users WHERE username = $1::text
       ON CONFLICT (nis) DO NOTHING`,
      [nis, `Lapor ${i + 1}`, CLASS],
    );
  }
  ids = (await db<{ id: number }>("SELECT id FROM students WHERE nis = ANY($1::text[]) ORDER BY nis", [NIS])).map((r) => r.id);
  // Lapor 2 adalah anak ortu2 (yang juga orang tua siswa seed 2024003).
  await db("UPDATE students SET parent_id = (SELECT p.id FROM parents p JOIN users u ON u.id = p.user_id WHERE u.username = 'ortu2') WHERE id = $1", [ids[1]]);

  const [schedule] = await db<{ id: number; teacher_id: number }>(
    `INSERT INTO schedules (teacher_id, class_name, subject, day, start_time, end_time)
     SELECT t.id, $1, 'Uji Laporan', 1, '08:00', '09:00' FROM teachers t JOIN users u ON u.id = t.user_id WHERE u.username = 'guru2'
     RETURNING id, teacher_id`,
    [CLASS],
  );
  const session = async (day: string) =>
    (
      await db<{ id: number }>(
        `INSERT INTO attendance_sessions (teacher_id, schedule_id, qr_token, opened_at, expires_at, status)
         VALUES ($1, $2, md5(random()::text) || md5(random()::text), $3::timestamp, $3::timestamp + interval '1 hour', 'CLOSED') RETURNING id`,
        [schedule.teacher_id, schedule.id, `${day} 01:00:00`],
      )
    )[0].id;
  const s1 = await session("2026-10-05");
  const s2 = await session("2026-10-06");

  const attend = (sessionId: number, studentId: number, status: string, at: string) =>
    db("INSERT INTO attendance (session_id, student_id, check_in_at, status) VALUES ($1, $2, $3::timestamp, $4::\"AttendanceStatus\")", [sessionId, studentId, at, status]);
  await attend(s1, ids[0], "HADIR", "2026-10-05 01:02:00");
  await attend(s2, ids[0], "HADIR", "2026-10-06 01:01:00");
  await attend(s1, ids[1], "TERLAMBAT", "2026-10-05 01:20:00");
  await db("UPDATE attendance SET check_out_at = '2026-10-06 01:45:00' WHERE session_id = $1 AND student_id = $2", [s2, ids[0]]);

  await db(
    `INSERT INTO leave_requests (student_id, type, date_from, date_to, reason, status) VALUES
     ($1, 'SAKIT', '2026-10-06', '2026-10-06', 'Demam', 'APPROVED'),
     ($2, 'IZIN', '2026-10-05', '2026-10-05', 'Belum diproses', 'PENDING')`,
    [ids[1], ids[2]],
  );
});

test("R-01 rekap kelas per periode sesuai data", async ({ page }) => {
  await loginAdmin(page);
  await page.goto(`/admin/laporan?kelas=${encodeURIComponent(CLASS)}&${PERIOD}`);
  await expect(page.getByTestId("report-meta")).toContainText("2 sesi · 3 siswa aktif");

  // Lewati kolom NIS dan Nama (baris Total hanya punya satu sel gabungan di depan).
  const cells = async (name: string, skip = 2) => {
    const row = page.getByRole("row", { name: new RegExp(name) });
    await expect(row).toBeVisible();
    return (await row.getByRole("cell").allTextContents()).slice(skip);
  };
  // Hadir, Terlambat, Izin, Sakit, Alpa, Tidak selesai, Kehadiran
  expect(await cells("Lapor 1")).toEqual(["2", "0", "0", "0", "0", "1", "100%"]);
  expect(await cells("Lapor 2")).toEqual(["0", "1", "0", "1", "0", "1", "50%"]);
  expect(await cells("Lapor 3")).toEqual(["0", "0", "0", "0", "2", "0", "0%"]);
  expect(await cells("Total", 1)).toEqual(["2", "1", "0", "1", "2", "2", "50%"]);
});

test("R-02 filter kelas dan periode lewat form", async ({ page }) => {
  await loginAdmin(page);
  await page.goto("/admin/laporan");
  await page.getByLabel("Kelas").selectOption(CLASS);
  await page.getByLabel("Dari tanggal").fill("2026-10-06");
  await page.getByLabel("Sampai tanggal").fill("2026-10-06");
  await page.getByRole("button", { name: "Tampilkan" }).click();
  await expect(page.getByTestId("report-meta")).toContainText("1 sesi");
  const row2 = page.getByRole("row", { name: /Lapor 2/ });
  await expect(row2).toBeVisible();
  const lapor2 = (await row2.getByRole("cell").allTextContents()).slice(2);
  expect(lapor2).toEqual(["0", "0", "0", "1", "0", "0", "0%"]);
});

test("R-03 ekspor Excel berisi angka yang sama", async ({ page }) => {
  await loginAdmin(page);
  await page.goto(`/admin/laporan?kelas=${encodeURIComponent(CLASS)}&${PERIOD}`);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Unduh Excel" }).click()]);
  expect(download.suggestedFilename()).toBe("rekap-XII-LAPORAN-2026-10-01-sd-2026-10-31.xlsx");

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(await download.path());
  const sheet = workbook.getWorksheet("Rekap")!;
  const rows = sheet.getSheetValues().filter(Boolean) as unknown[][];
  const find = (name: string) => rows.find((r) => r.includes(name))!.slice(1);
  expect(find("Lapor 1")).toEqual([1, "9920001", "Lapor 1", 2, 0, 0, 0, 0, 1, 100]);
  expect(find("Lapor 3")).toEqual([3, "9920003", "Lapor 3", 0, 0, 0, 0, 2, 0, 0]);
  expect(find("Total").slice(2)).toEqual(["Total", 2, 1, 0, 1, 2, 2, 50]);
  expect(rows.some((r) => r.includes("Periode: 2026-10-01 s.d. 2026-10-31"))).toBe(true);
});

test("R-04 detail per siswa dari rekap", async ({ page }) => {
  await loginAdmin(page);
  await page.goto(`/admin/laporan?kelas=${encodeURIComponent(CLASS)}&${PERIOD}`);
  await page.getByRole("link", { name: "Lapor 2" }).click();
  await expect(page.getByRole("heading", { name: "Lapor 2" })).toBeVisible();
  await expect(page.getByTestId("student-summary")).toContainText("Kehadiran50%");
  await expect(page.getByText("Sakit").filter({ visible: true }).first()).toBeVisible();
});

test("R-05 siswa dan guru tidak bisa membuka laporan", async ({ page }) => {
  await login(page, "guru1", undefined, "/guru");
  await page.goto("/admin/laporan");
  await expect(page).toHaveURL("/guru");
  const res = await page.request.get(`/admin/laporan/excel?kelas=${encodeURIComponent(CLASS)}`, { maxRedirects: 0 });
  expect(res.status()).toBe(307);
});

test("P-01 orang tua memilih anak dan periode, melihat riwayat", async ({ page }) => {
  await login(page, "ortu2", undefined, "/orang-tua");
  const children = page.getByRole("navigation", { name: "Pilih anak" });
  await expect(children.getByRole("link")).toHaveCount(2);
  await children.getByRole("link", { name: "Lapor 2" }).click();
  await expect(page.getByTestId("child-name")).toHaveText("Lapor 2");

  await page.getByLabel("Dari tanggal").fill("2026-10-01");
  await page.getByLabel("Sampai tanggal").fill("2026-10-31");
  await page.getByRole("button", { name: "Tampilkan" }).click();
  await expect(page.getByTestId("child-name")).toHaveText("Lapor 2"); // anak yang dipilih tetap
  const summary = page.getByTestId("student-summary");
  await expect(summary).toContainText("Terlambat1");
  await expect(summary).toContainText("Sakit1");
  await expect(summary).toContainText("Kehadiran50%");
  await expect(page.getByTestId("checkout-missing-note")).toContainText("1 kali hadir tetapi tidak absen selesai");
  await expect(page.getByText("Uji Laporan").filter({ visible: true })).toHaveCount(2);
  await expect(page.getByText("Demam")).toBeVisible();
});

test("P-02 orang tua tidak bisa melihat anak lain (skenario uji no. 12)", async ({ page }) => {
  await login(page, "ortu2", undefined, "/orang-tua");
  // Halaman di-streaming sehingga kode HTTP tetap 200; yang penting isi halaman 404 dan data tidak bocor.
  await page.goto(`/orang-tua?anak=${ids[0]}&${PERIOD}`);
  await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
  await expect(page.getByText("Lapor 1")).toHaveCount(0);
  await expect(page.getByTestId("student-summary")).toHaveCount(0);
});

test("P-03 orang tua tanpa anak terhubung mendapat petunjuk", async ({ page }) => {
  await db(
    `INSERT INTO users (username, password_hash, role) SELECT 'ortu.kosong', password_hash, 'PARENT' FROM users WHERE username = 'admin'
     ON CONFLICT (username) DO NOTHING`,
  );
  await db("INSERT INTO parents (user_id, name) SELECT id, 'Ortu Kosong' FROM users WHERE username = 'ortu.kosong' ON CONFLICT (user_id) DO NOTHING");
  await login(page, "ortu.kosong", undefined, "/orang-tua");
  await expect(page.getByText("belum terhubung dengan data siswa")).toBeVisible();
});

test("PWA manifest dan ikon tersedia", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest).toMatchObject({ short_name: "Absensi SMK", display: "standalone", start_url: "/" });
  for (const icon of manifest.icons) {
    expect((await request.get(icon.src)).ok(), icon.src).toBe(true);
  }
});
