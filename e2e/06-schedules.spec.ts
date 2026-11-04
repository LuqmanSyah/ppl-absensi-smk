// CRUD jadwal pelajaran (S1-06). Seed: guru1 (Budi Santoso) mengajar XI RPL 1, Senin 07:00-08:30.
import { expect, test, type Page } from "@playwright/test";
import { db, loginAdmin, field } from "./helpers";

async function fillSchedule(
  page: Page,
  v: { teacher: string; className: string; subject: string; day: string; start: string; end: string },
) {
  await field(page, "Guru").selectOption({ label: v.teacher });
  await field(page, "Kelas").fill(v.className);
  await field(page, "Mata pelajaran").fill(v.subject);
  await field(page, "Hari").selectOption({ label: v.day });
  await field(page, "Jam mulai").fill(v.start);
  await field(page, "Jam selesai").fill(v.end);
}

const BUDI = "Budi Santoso (198501012010011001)";
const SITI = "Siti Rahmawati (199002022015022002)";

test.describe("Jadwal pelajaran", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/admin/jadwal/baru");
  });

  test("J-01 jam selesai sebelum jam mulai ditolak", async ({ page }) => {
    await fillSchedule(page, { teacher: BUDI, className: "XI RPL 2", subject: "Uji", day: "Senin", start: "09:00", end: "08:00" });
    await page.getByRole("button", { name: "Tambah jadwal" }).click();
    await expect(page.getByText("Jam selesai harus setelah jam mulai.")).toBeVisible();
    // Pilihan dropdown tetap tersimpan setelah gagal.
    await expect(field(page, "Hari")).toHaveValue("1");
  });

  test("J-02 jadwal guru bentrok ditolak", async ({ page }) => {
    await fillSchedule(page, { teacher: BUDI, className: "XI RPL 2", subject: "Uji", day: "Senin", start: "08:00", end: "09:00" });
    await page.getByRole("button", { name: "Tambah jadwal" }).click();
    await expect(page.getByText(/Bentrok dengan jadwal Budi Santoso/)).toBeVisible();
  });

  test("J-03 jadwal kelas bentrok ditolak", async ({ page }) => {
    await fillSchedule(page, { teacher: SITI, className: "XI RPL 1", subject: "Uji", day: "Senin", start: "08:00", end: "09:00" });
    await page.getByRole("button", { name: "Tambah jadwal" }).click();
    await expect(page.getByText(/Kelas XI RPL 1 sudah ada pelajaran/)).toBeVisible();
  });

  test("J-04..06 tambah jadwal bersambung, ubah, lalu hapus", async ({ page }) => {
    await fillSchedule(page, { teacher: BUDI, className: "XI RPL 2", subject: "Uji E2E", day: "Senin", start: "08:30", end: "10:00" });
    await page.getByRole("button", { name: "Tambah jadwal" }).click();
    await expect(page).toHaveURL("/admin/jadwal");
    const row = page.getByRole("row", { name: /Uji E2E/ });
    await expect(row).toContainText("Senin");
    await expect(row).toContainText("08:30-10:00");

    await row.getByRole("link", { name: "Ubah" }).click();
    await expect(field(page, "Jam mulai")).toHaveValue("08:30");
    await field(page, "Mata pelajaran").fill("Uji E2E Diubah");
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page).toHaveURL("/admin/jadwal");
    await expect(page.getByRole("row", { name: /Uji E2E Diubah/ })).toBeVisible();

    await page.getByRole("row", { name: /Uji E2E Diubah/ }).getByRole("link", { name: "Ubah" }).click();
    await page.getByRole("button", { name: "Hapus jadwal" }).click();
    await expect(page.getByText("Hapus jadwal ini?")).toBeVisible();
    await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
    await expect(page).toHaveURL("/admin/jadwal");
    await expect(page.getByRole("row", { name: /Uji E2E Diubah/ })).toHaveCount(0);
  });

  test("J-07 guru nonaktif tidak muncul di pilihan", async ({ page }) => {
    await db("UPDATE users SET is_active = false WHERE username = 'guru2'");
    try {
      await page.reload();
      await expect(field(page, "Guru").locator("option", { hasText: "Siti Rahmawati" })).toHaveCount(0);
      await expect(field(page, "Guru").locator("option", { hasText: "Budi Santoso" })).toHaveCount(1);
    } finally {
      await db("UPDATE users SET is_active = true WHERE username = 'guru2'");
    }
  });
});
