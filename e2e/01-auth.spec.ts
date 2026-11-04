// Login dan logout (S1-01). Nomor uji mengacu ke docs/testing-sprint-1.md.
import { expect, test } from "@playwright/test";
import { db, login, logout, uniqueDigits } from "./helpers";

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

  test("L-11 lima kali password salah mengunci username sementara", async ({ page }) => {
    // Akun khusus tes ini (dibuat di database) agar akun seed tidak ikut terkunci.
    const username = `kunci${uniqueDigits()}`;
    const [admin] = await db<{ password_hash: string }>("SELECT password_hash FROM users WHERE username = 'admin'");
    await db("INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'ADMIN')", [username, admin.password_hash]);

    for (let i = 0; i < 5; i++) {
      await login(page, username, "salah");
      await expect(page.getByText("Username atau password salah.")).toBeVisible();
    }
    // Password benar pun ditolak selama dikunci.
    await login(page, username);
    await expect(page.getByText(/Terlalu banyak percobaan login yang gagal\. Coba lagi dalam 1[45] menit\./)).toBeVisible();
    await expect(page).toHaveURL("/login");

    const blocked = await db("SELECT 1 FROM audit_logs WHERE action = 'LOGIN_BLOCKED' AND detail->>'username' = $1", [username]);
    expect(blocked).toHaveLength(1);

    // Username lain tidak ikut terkunci.
    await login(page, "admin", undefined, "/admin");
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
      await expect(page.getByRole("heading", { name: `Halo, ${r.name}` })).toBeVisible();
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
