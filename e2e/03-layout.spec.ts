// Layout dan navigasi di layar desktop (S1-03).
import { expect, test } from "@playwright/test";
import { db, loginAdmin } from "./helpers";

test.describe("Layout admin (desktop)", () => {
  test("N-01/N-02 sidebar berisi menu dan menandai menu aktif", async ({ page }) => {
    await loginAdmin(page);
    const nav = page.getByRole("navigation", { name: "Navigasi utama" }).first();
    for (const label of ["Dashboard", "Siswa", "Guru", "Orang Tua", "Jadwal", "Lokasi Sekolah"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
    await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");

    await nav.getByRole("link", { name: "Jadwal" }).click();
    await expect(page).toHaveURL("/admin/jadwal");
    await expect(page.getByRole("heading", { name: "Jadwal Pelajaran" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Jadwal" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current", "page");
  });

  test("N-04 angka di dashboard sesuai database", async ({ page }) => {
    const [counts] = await db<Record<string, string>>(`
      SELECT
        (SELECT count(*) FROM students s JOIN users u ON u.id = s.user_id WHERE u.is_active) AS students,
        (SELECT count(*) FROM teachers t JOIN users u ON u.id = t.user_id WHERE u.is_active) AS teachers,
        (SELECT count(*) FROM schedules) AS schedules,
        (SELECT count(*) FROM school_locations WHERE is_active) AS locations`);
    await loginAdmin(page);
    const cards = [
      ["Siswa aktif", counts.students],
      ["Guru aktif", counts.teachers],
      ["Jadwal pelajaran", counts.schedules],
      ["Lokasi aktif", counts.locations],
    ];
    for (const [label, value] of cards) {
      await expect(page.getByRole("link", { name: new RegExp(`${label}\\s*${value}`) })).toBeVisible();
    }
  });

  test("N-06 kartu dashboard membuka halaman data", async ({ page }) => {
    await loginAdmin(page);
    await page.getByRole("link", { name: /Guru aktif/ }).click();
    await expect(page).toHaveURL("/admin/guru");
  });
});
