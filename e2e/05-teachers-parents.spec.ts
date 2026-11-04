// CRUD guru (S1-05) dan orang tua (bagian dari S1-04).
import { expect, test } from "@playwright/test";
import { loginAdmin, login, logout, uniqueDigits, field } from "./helpers";

test.describe("Data guru", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/admin/guru/baru");
  });

  async function fillTeacher(page: import("@playwright/test").Page, nip: string, username: string) {
    await field(page, "NIP").fill(nip);
    await field(page, "Nama lengkap").fill("Guru Uji E2E, S.Kom.");
    await field(page, "Username").fill(username);
    await field(page, "Password awal").fill("password123");
    await page.getByRole("button", { name: "Tambah guru" }).click();
  }

  test("U-01 NIP salah format ditolak", async ({ page }) => {
    await fillTeacher(page, "123", "guru.baru");
    await expect(page.getByText("NIP hanya berisi angka, 8-30 digit.")).toBeVisible();
  });

  test("U-02 NIP duplikat ditolak", async ({ page }) => {
    await fillTeacher(page, "198501012010011001", "guru.baru");
    await expect(page.getByText("NIP sudah terdaftar.")).toBeVisible();
  });

  test("U-03 username duplikat ditolak", async ({ page }) => {
    await fillTeacher(page, `2000${uniqueDigits(10)}`, "guru1");
    await expect(page.getByText("Username sudah dipakai.")).toBeVisible();
  });

  test("U-04/U-05 tambah guru, username jadi huruf kecil, bisa login, lihat jadwal", async ({ page }) => {
    const suffix = uniqueDigits();
    await fillTeacher(page, `2000${uniqueDigits(10)}`, `Guru.E2E${suffix}`);
    await expect(page).toHaveURL("/admin/guru");
    const row = page.getByRole("row", { name: new RegExp(`guru\\.e2e${suffix}`) });
    await expect(row).toContainText("Guru Uji E2E");

    await row.getByRole("link", { name: "Ubah" }).click();
    await page.getByRole("link", { name: "Lihat jadwal" }).click();
    await expect(page).toHaveURL(/\/admin\/jadwal\?guru=\d+/);
    await expect(page.getByText("Belum ada jadwal.")).toBeVisible();

    await logout(page);
    await login(page, `guru.e2e${suffix}`, "password123", "/guru");
  });
});

test.describe("Data orang tua", () => {
  test("O-01..03 tambah orang tua dan hubungkan ke siswa", async ({ page }) => {
    const username = `ortu.e2e${uniqueDigits()}`;
    await loginAdmin(page);

    await page.goto("/admin/orang-tua/baru");
    await field(page, "Nama lengkap").fill("Ortu Uji E2E");
    await field(page, "Username").fill("ortu1");
    await field(page, "Password awal").fill("password123");
    await page.getByRole("button", { name: "Tambah orang tua" }).click();
    await expect(page.getByText("Username sudah dipakai.")).toBeVisible();

    await field(page, "Username").fill(username);
    await field(page, "Password awal").fill("password123");
    await page.getByRole("button", { name: "Tambah orang tua" }).click();
    await expect(page).toHaveURL("/admin/orang-tua");
    await expect(page.getByRole("row", { name: new RegExp(username) })).toContainText("Belum terhubung");

    // Hubungkan ke siswa 2024005 (Dimas Pratama)
    await page.goto("/admin/siswa?q=2024005");
    await page.getByRole("row", { name: /2024005/ }).getByRole("link", { name: "Ubah" }).click();
    await field(page, "Orang tua / wali").selectOption({ label: `Ortu Uji E2E (${username})` });
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page).toHaveURL("/admin/siswa");

    await page.goto("/admin/orang-tua");
    await expect(page.getByRole("row", { name: new RegExp(username) })).toContainText("Dimas Pratama (XI RPL 2)");

    await logout(page);
    await login(page, username, "password123", "/orang-tua");
  });
});
