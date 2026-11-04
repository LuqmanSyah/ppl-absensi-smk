// CRUD lokasi sekolah (S1-07).
import { expect, test } from "@playwright/test";
import { db, loginAdmin, field } from "./helpers";

test.describe("Lokasi sekolah", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test("K-01 koordinat dan radius tidak valid ditolak", async ({ page }) => {
    await page.goto("/admin/lokasi/baru");
    await field(page, "Nama lokasi").fill("Lokasi Salah");
    await field(page, "Latitude").fill("100");
    await field(page, "Longitude").fill("abc");
    await field(page, "Radius (meter)").fill("5");
    await page.getByRole("button", { name: "Tambah lokasi" }).click();
    await expect(page.getByText("Latitude harus antara -90 dan 90.")).toBeVisible();
    await expect(page.getByText("Longitude harus berupa angka.")).toBeVisible();
    await expect(page.getByText("Radius minimal 20 meter.")).toBeVisible();
  });

  test("K-02..06 hanya satu lokasi aktif, hapus lokasi tidak aktif", async ({ page }) => {
    await page.goto("/admin/lokasi/baru");
    await field(page, "Nama lokasi").fill("Gedung E2E");
    await field(page, "Latitude").fill("-6,2000000");
    await field(page, "Longitude").fill("106.8");
    await field(page, "Radius (meter)").fill("150");
    await expect(field(page, "Jadikan lokasi aktif")).toBeChecked();
    await page.getByRole("button", { name: "Tambah lokasi" }).click();
    await expect(page).toHaveURL("/admin/lokasi");

    const active = await db<{ name: string }>("SELECT name FROM school_locations WHERE is_active");
    expect(active.map((l) => l.name)).toEqual(["Gedung E2E"]);
    await expect(page.getByRole("row", { name: /Gedung E2E/ })).toContainText("Aktif");
    await expect(page.getByRole("row", { name: /SMK Putra Perdana/ })).toContainText("Tidak dipakai");

    // K-03 tautan Google Maps
    const mapLink = page.getByRole("row", { name: /Gedung E2E/ }).getByRole("link", { name: /-6\.2/ });
    await expect(mapLink).toHaveAttribute("href", /google\.com\/maps.*-6\.2/);
    await expect(mapLink).toHaveAttribute("target", "_blank");

    // K-04 lokasi aktif tidak punya tombol hapus
    await page.getByRole("row", { name: /Gedung E2E/ }).getByRole("link", { name: "Ubah" }).click();
    await expect(page.getByRole("button", { name: "Hapus lokasi" })).toHaveCount(0);

    // Kembalikan lokasi lama sebagai lokasi aktif
    await page.goto("/admin/lokasi");
    await page.getByRole("row", { name: /SMK Putra Perdana/ }).getByRole("link", { name: "Ubah" }).click();
    await field(page, "Jadikan lokasi aktif").check();
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page.getByRole("row", { name: /SMK Putra Perdana/ })).toContainText("Aktif");

    // K-05 hapus lokasi yang sudah tidak aktif
    await page.getByRole("row", { name: /Gedung E2E/ }).getByRole("link", { name: "Ubah" }).click();
    await page.getByRole("button", { name: "Hapus lokasi" }).click();
    await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
    await expect(page).toHaveURL("/admin/lokasi");
    await expect(page.getByRole("row", { name: /Gedung E2E/ })).toHaveCount(0);
  });

  test("K-06 peringatan saat tidak ada lokasi aktif", async ({ page }) => {
    await db("UPDATE school_locations SET is_active = false");
    try {
      await page.goto("/admin/lokasi");
      await expect(page.getByText("Belum ada lokasi aktif.", { exact: false })).toBeVisible();
    } finally {
      await db("UPDATE school_locations SET is_active = true WHERE name = 'SMK Putra Perdana Indonesia'");
    }
  });
});
