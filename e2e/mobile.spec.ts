// Tampilan di layar HP (S1-03, NFR-01). Dijalankan oleh project "mobile" (Pixel 7).
import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers";

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "halaman tidak boleh bisa digeser ke samping").toBeLessThanOrEqual(1);
}

test("N-03 admin di HP: sidebar disembunyikan, menu tampil di header", async ({ page }) => {
  await login(page, "admin", undefined, "/admin");
  await expect(page.locator("aside")).toBeHidden();
  const topNav = page.locator("header").getByRole("navigation", { name: "Navigasi utama" });
  await expect(topNav).toBeVisible();
  await topNav.getByRole("link", { name: "Siswa" }).click();
  await expect(page).toHaveURL("/admin/siswa");
  await expectNoHorizontalScroll(page);
});

for (const { username, path, name } of [
  { username: "guru1", path: "/guru", name: "Budi Santoso" },
  { username: "2024001", path: "/siswa", name: "Rizky Wijaya" },
  { username: "ortu1", path: "/orang-tua", name: "Ahmad Wijaya" },
]) {
  test(`N-05 ${username} di HP: header berisi nama dan tombol keluar`, async ({ page }) => {
    await login(page, username, undefined, path);
    const header = page.locator("header");
    await expect(header.getByText(name)).toBeVisible();
    await expect(header.getByRole("button", { name: "Keluar" })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
}

test("form tambah siswa bisa dipakai di HP", async ({ page }) => {
  await login(page, "admin", undefined, "/admin");
  await page.goto("/admin/siswa/baru");
  await expect(page.getByLabel("NIS")).toBeVisible();
  await expectNoHorizontalScroll(page);
});
