// Login dan logout (S1-01). Nomor uji mengacu ke docs/testing-sprint-1.md.
import { expect, test } from "@playwright/test";
import { login, logout } from "./helpers";

test.describe("Login", () => {
  test("L-01 form kosong menampilkan pesan per field", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page.getByText("Username wajib diisi.")).toBeVisible();
    await expect(page.getByText("Password wajib diisi.")).toBeVisible();
  });

  test("L-02 password salah ditolak dan username tetap terisi", async ({ page }) => {
    await login(page, "admin", "salah");
    await expect(page.getByText("Username atau password salah.")).toBeVisible();
    await expect(page.getByLabel("Username")).toHaveValue("admin");
    await expect(page).toHaveURL("/login");
  });

  test("L-03 username tidak terdaftar memberi pesan yang sama", async ({ page }) => {
    await login(page, "tidakada", "password123");
    await expect(page.getByText("Username atau password salah.")).toBeVisible();
  });

  const roles = [
    { username: "admin", path: "/admin", name: "Admin TU" },
    { username: "guru1", path: "/guru", name: "Budi Santoso" },
    { username: "2024001", path: "/siswa", name: "Rizky Wijaya" },
    { username: "ortu1", path: "/orang-tua", name: "Ahmad Wijaya" },
  ];
  for (const r of roles) {
    test(`L-04..07 login ${r.username} masuk ke ${r.path}`, async ({ page }) => {
      await login(page, r.username, undefined, r.path);
      await expect(page.getByText(`Halo, ${r.name}`)).toBeVisible();
    });
  }

  test("L-08 logout kembali ke login dan halaman terlindungi tertutup", async ({ page }) => {
    await login(page, "admin", undefined, "/admin");
    await logout(page);
    await page.goto("/admin");
    await expect(page).toHaveURL("/login");
  });

  test("L-09 cookie sesi bersifat httpOnly", async ({ page, context }) => {
    await login(page, "admin", undefined, "/admin");
    const session = (await context.cookies()).find((c) => c.name === "session");
    expect(session).toBeDefined();
    expect(session!.httpOnly).toBe(true);
    expect(session!.sameSite).toBe("Lax");
    // Tidak bisa dibaca JavaScript di halaman.
    expect(await page.evaluate(() => document.cookie)).not.toContain("session=");
  });

  test("L-10 menghapus cookie mengakhiri sesi", async ({ page, context }) => {
    await login(page, "admin", undefined, "/admin");
    await context.clearCookies();
    await page.reload();
    await expect(page).toHaveURL("/login");
  });
});
