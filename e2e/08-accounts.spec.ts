// Nonaktifkan dan aktifkan akun (S1-10).
import { expect, test } from "@playwright/test";
import { login, loginAdmin, logout } from "./helpers";

const accounts = [
  { list: "/admin/siswa", row: /2024006/, username: "2024006", home: "/siswa" },
  { list: "/admin/guru", row: /guru2/, username: "guru2", home: "/guru" },
  { list: "/admin/orang-tua", row: /ortu2/, username: "ortu2", home: "/orang-tua" },
];

for (const a of accounts) {
  test(`X-01..04 nonaktifkan dan aktifkan akun ${a.username}`, async ({ page }) => {
    await loginAdmin(page);
    await page.goto(a.list);
    await page.getByRole("row", { name: a.row }).getByRole("link", { name: "Ubah" }).click();

    // X-01 konfirmasi bisa dibatalkan
    await page.getByRole("button", { name: "Nonaktifkan akun" }).click();
    await expect(page.getByText("Nonaktifkan akun ini?")).toBeVisible();
    await page.getByRole("button", { name: "Batal" }).click();
    await expect(page.getByText("Nonaktifkan akun ini?")).toHaveCount(0);

    // X-02 nonaktifkan
    await page.getByRole("button", { name: "Nonaktifkan akun" }).click();
    await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
    await expect(page.getByText("Akun dinonaktifkan. Pengguna tidak bisa login lagi.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Aktifkan kembali" })).toBeVisible();
    await page.goto(a.list);
    await expect(page.getByRole("row", { name: a.row })).toContainText("Nonaktif");

    await logout(page);
    await login(page, a.username);
    await expect(page.getByText("Akun Anda dinonaktifkan. Hubungi Admin TU.")).toBeVisible();

    // X-03 aktifkan kembali
    await loginAdmin(page);
    await page.goto(a.list);
    await page.getByRole("row", { name: a.row }).getByRole("link", { name: "Ubah" }).click();
    await page.getByRole("button", { name: "Aktifkan kembali" }).click();
    await expect(page.getByText("Akun diaktifkan kembali.")).toBeVisible();

    await logout(page);
    await login(page, a.username, undefined, a.home);
  });
}

test("X-05 dashboard menghitung ulang siswa aktif", async ({ page }) => {
  await loginAdmin(page);
  const card = page.getByRole("link", { name: /Siswa aktif/ });
  const before = Number((await card.textContent())!.match(/\d+/)![0]);

  await page.goto("/admin/siswa?q=2024006");
  await page.getByRole("row", { name: /2024006/ }).getByRole("link", { name: "Ubah" }).click();
  await page.getByRole("button", { name: "Nonaktifkan akun" }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(page.getByRole("button", { name: "Aktifkan kembali" })).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByRole("link", { name: new RegExp(`Siswa aktif\\s*${before - 1}`) })).toBeVisible();

  await page.goto("/admin/siswa?q=2024006");
  await page.getByRole("row", { name: /2024006/ }).getByRole("link", { name: "Ubah" }).click();
  await page.getByRole("button", { name: "Aktifkan kembali" }).click();
  await expect(page.getByText("Akun diaktifkan kembali.")).toBeVisible();
});
