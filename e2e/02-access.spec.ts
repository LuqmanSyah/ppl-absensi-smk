// Hak akses per peran (S1-02).
import { expect, test } from "@playwright/test";
import { db, login } from "./helpers";

test.describe("Hak akses", () => {
  test("A-01/A-02 tanpa login semua halaman terlindungi diarahkan ke /login", async ({ page }) => {
    for (const path of ["/", "/admin", "/admin/siswa", "/guru", "/siswa", "/orang-tua"]) {
      await page.goto(path);
      await expect(page, `membuka ${path}`).toHaveURL("/login");
    }
  });

  const cases = [
    { username: "2024001", home: "/siswa", forbidden: ["/admin", "/admin/siswa/baru", "/guru", "/orang-tua"] },
    { username: "guru1", home: "/guru", forbidden: ["/admin", "/siswa", "/orang-tua"] },
    { username: "ortu1", home: "/orang-tua", forbidden: ["/admin", "/siswa", "/guru"] },
    { username: "admin", home: "/admin", forbidden: ["/guru", "/siswa", "/orang-tua"] },
  ];
  for (const c of cases) {
    test(`A-03..05 ${c.username} tidak bisa membuka halaman peran lain`, async ({ page }) => {
      await login(page, c.username, undefined, c.home);
      for (const path of c.forbidden) {
        await page.goto(path);
        await expect(page, `membuka ${path}`).toHaveURL(c.home);
      }
    });
  }

  test("A-06 setelah login, / diarahkan ke halaman peran", async ({ page }) => {
    await login(page, "guru1", undefined, "/guru");
    await page.goto("/");
    await expect(page).toHaveURL("/guru");
  });

  test("A-07..09 akun dinonaktifkan saat masih login langsung kehilangan akses", async ({ page }) => {
    await login(page, "2024004", undefined, "/siswa");
    await db("UPDATE users SET is_active = false WHERE username = '2024004'");
    try {
      await page.reload();
      await expect(page).toHaveURL("/login");

      await login(page, "2024004");
      await expect(page.getByText("Akun Anda dinonaktifkan. Hubungi Admin TU.")).toBeVisible();
    } finally {
      await db("UPDATE users SET is_active = true WHERE username = '2024004'");
    }
    await login(page, "2024004", undefined, "/siswa");
  });
});
