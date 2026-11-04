// Impor siswa dari CSV (S1-11).
import { expect, test, type Page } from "@playwright/test";
import { db, login, loginAdmin, logout, field } from "./helpers";

async function upload(page: Page, csv: string, name = "siswa.csv") {
  await page.goto("/admin/siswa/impor");
  await field(page, "File CSV").setInputFiles({ name, mimeType: "text/csv", buffer: Buffer.from(csv) });
  await field(page, "Password awal untuk semua siswa").fill("password123");
  await page.getByRole("button", { name: "Impor siswa" }).click();
}

const countStudents = async () => Number((await db<{ n: string }>("SELECT count(*) AS n FROM students"))[0].n);

test.describe("Impor CSV", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test("I-01 file dengan kesalahan dibatalkan seluruhnya", async ({ page }) => {
    const before = await countStudents();
    await upload(
      page,
      "nis;nama;kelas\n9024201;Andi Saputra;X RPL 1\nxx;B;X RPL 1\n9024201;Dobel;X RPL 1\n2024001;Siswa Lama;X RPL 1\n",
    );
    const alert = page.getByRole("alert").filter({ hasText: "Impor dibatalkan" });
    await expect(alert).toContainText("Impor dibatalkan, tidak ada data yang disimpan.");
    await expect(alert).toContainText("Baris 3:");
    await expect(alert).toContainText("Baris 4: NIS 9024201 sama dengan baris 2.");
    expect(await countStudents()).toBe(before);
  });

  test("I-02/I-03 file benar (BOM, kutip, koma di nama) berhasil", async ({ page }) => {
    await upload(page, '﻿nis,nama,kelas\n9024301,"Saputra, Andi",x rpl 1\n9024302,Bunga Citra,X RPL 1\n');
    await expect(page).toHaveURL("/admin/siswa");
    await expect(page.getByRole("row", { name: /9024301/ })).toContainText("Saputra, Andi");
    await expect(page.getByRole("row", { name: /9024301/ })).toContainText("X RPL 1");

    await logout(page);
    await login(page, "9024302", "password123", "/siswa");
  });

  test("I-04 judul kolom salah ditolak", async ({ page }) => {
    await upload(page, "nama,kelas\nA,B\n");
    await expect(page.getByText("Baris pertama harus berisi judul kolom: nis, nama, kelas.")).toBeVisible();
  });
});
