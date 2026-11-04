// CRUD siswa (S1-04) dan validasi (S1-08).
import { expect, test } from "@playwright/test";
import { db, login, loginAdmin, logout, uniqueDigits, field } from "./helpers";

test.describe("Data siswa", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test("D-01 input salah ditolak, isian tetap ada, password dikosongkan", async ({ page }) => {
    await page.goto("/admin/siswa/baru");
    await field(page, "NIS").fill("abc");
    await field(page, "Nama lengkap").fill("A");
    await field(page, "Kelas").fill("XI RPL 1");
    await field(page, "Password awal").fill("123");
    await page.getByRole("button", { name: "Tambah siswa" }).click();

    await expect(page.getByText("Periksa kembali isian yang ditandai.")).toBeVisible();
    await expect(page.getByText("NIS hanya berisi angka, 4-20 digit.")).toBeVisible();
    await expect(page.getByText("Nama minimal 3 karakter.")).toBeVisible();
    await expect(page.getByText("Password minimal 8 karakter.")).toBeVisible();
    // Isian tidak hilang, field yang salah ditandai.
    await expect(field(page, "NIS")).toHaveValue("abc");
    await expect(field(page, "Kelas")).toHaveValue("XI RPL 1");
    await expect(field(page, "NIS")).toHaveAttribute("aria-invalid", "true");
    // Password tidak dikirim balik dari server; yang sudah diketik tetap ada di browser.
    await expect(field(page, "Password awal")).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL("/admin/siswa/baru");
  });

  test("D-02 NIS duplikat ditolak", async ({ page }) => {
    await page.goto("/admin/siswa/baru");
    await field(page, "NIS").fill("2024001");
    await field(page, "Nama lengkap").fill("Siswa Duplikat");
    await field(page, "Kelas").fill("XI RPL 1");
    await field(page, "Password awal").fill("password123");
    await page.getByRole("button", { name: "Tambah siswa" }).click();
    await expect(page.getByText("NIS sudah terdaftar.")).toBeVisible();
  });

  test("D-03..07 tambah, ubah, ganti password siswa", async ({ page }) => {
    const nis = `77${uniqueDigits()}`;
    const newNis = `78${uniqueDigits()}`;

    // D-03 tambah dengan kelas tidak rapi dan orang tua
    await page.goto("/admin/siswa");
    await page.getByRole("link", { name: "Tambah siswa" }).click();
    await expect(page.getByRole("heading", { name: "Tambah Siswa" })).toBeVisible();
    await field(page, "NIS").fill(nis);
    await field(page, "Nama lengkap").fill("Siswa Uji E2E");
    // Next.js menyimpan halaman daftar (dengan filter "Kelas") tersembunyi di DOM, jadi pilih yang terlihat.
    await field(page, "Kelas").fill("  xi   rpl 1 ");
    await field(page, "Orang tua / wali").selectOption({ label: "Ahmad Wijaya (ortu1)" });
    await field(page, "Password awal").fill("rahasia123");
    await page.getByRole("button", { name: "Tambah siswa" }).click();

    await expect(page).toHaveURL("/admin/siswa");
    const row = page.getByRole("row", { name: new RegExp(nis) });
    await expect(row).toContainText("Siswa Uji E2E");
    await expect(row).toContainText("XI RPL 1");
    await expect(row).toContainText("Ahmad Wijaya");
    await expect(row).toContainText("Aktif");

    // D-04 siswa baru bisa login
    await logout(page);
    await login(page, nis, "rahasia123", "/siswa");
    await logout(page);
    await loginAdmin(page);

    // D-05 ubah NIS dan lepas orang tua, password dikosongkan
    await page.goto("/admin/siswa");
    await page.getByRole("row", { name: new RegExp(nis) }).getByRole("link", { name: "Ubah" }).click();
    await expect(field(page, "NIS")).toHaveValue(nis);
    await expect(field(page, "Orang tua / wali")).toHaveValue(/\d+/);
    await field(page, "NIS").fill(newNis);
    await field(page, "Orang tua / wali").selectOption({ label: "Belum dihubungkan" });
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page).toHaveURL("/admin/siswa");
    await expect(page.getByRole("row", { name: new RegExp(newNis) })).toContainText("-");

    // D-07 NIS milik siswa lain ditolak
    await page.getByRole("row", { name: new RegExp(newNis) }).getByRole("link", { name: "Ubah" }).click();
    await field(page, "NIS").fill("2024001");
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page.getByText("NIS sudah terdaftar.")).toBeVisible();

    // D-06 ganti password
    await field(page, "NIS").fill(newNis);
    await field(page, "Password baru").fill("passwordbaru1");
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page).toHaveURL("/admin/siswa");

    await logout(page);
    await login(page, newNis, "rahasia123");
    await expect(page.getByText("Username atau password salah.")).toBeVisible();
    await login(page, newNis, "passwordbaru1", "/siswa");

    const [student] = await db("SELECT u.username FROM students s JOIN users u ON u.id = s.user_id WHERE s.nis = $1", [newNis]);
    expect(student.username).toBe(newNis);
  });

  test("D-08 pencarian dan filter kelas", async ({ page }) => {
    await page.goto("/admin/siswa");
    await page.getByPlaceholder("Cari nama atau NIS").fill("rizky");
    await page.getByRole("button", { name: "Cari" }).click();
    await expect(page).toHaveURL(/q=rizky/);
    await expect(page.getByRole("row", { name: /Rizky Wijaya/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Nadia Wijaya/ })).toHaveCount(0);

    await page.getByPlaceholder("Cari nama atau NIS").fill("");
    await field(page, "Kelas").selectOption("XI RPL 2");
    await page.getByRole("button", { name: "Cari" }).click();
    await expect(page.getByRole("row", { name: /Nadia Wijaya/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Rizky Wijaya/ })).toHaveCount(0);
  });

  test("V-01 validasi server tetap berlaku walau validasi browser dihapus", async ({ page }) => {
    await page.goto("/admin/siswa/baru");
    await page.evaluate(() => document.querySelectorAll("[required]").forEach((el) => el.removeAttribute("required")));
    await page.getByRole("button", { name: "Tambah siswa" }).click();
    await expect(page.getByText("NIS hanya berisi angka, 4-20 digit.")).toBeVisible();
    await expect(page.getByText("Password minimal 8 karakter.")).toBeVisible();
  });
});
