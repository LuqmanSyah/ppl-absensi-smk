import { expect, type Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_DATABASE_URL, PASSWORD } from "./env";

/** Login lewat form, lalu menunggu sampai halaman awal peran terbuka. */
export async function login(page: Page, username: string, password = PASSWORD, expectedPath?: string) {
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
  if (expectedPath) await expect(page).toHaveURL(expectedPath);
}

export const loginAdmin = (page: Page) => login(page, "admin", PASSWORD, "/admin");

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL("/login");
}

/** Menjalankan query ke database E2E untuk memeriksa hasil di database. */
export async function db<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    await client.end();
  }
}

/** Angka unik untuk data uji, agar tes bisa diulang tanpa bentrok. */
export function uniqueDigits(length = 6) {
  return String(Date.now()).slice(-length);
}

/**
 * Field form berdasarkan label persis yang sedang terlihat.
 * Next.js 16 menyimpan halaman sebelumnya tersembunyi di DOM (untuk tombol Back),
 * sehingga label yang sama bisa muncul dua kali; yang tersembunyi diabaikan.
 */
export function field(page: Page, label: string) {
  return page.getByLabel(label, { exact: true }).filter({ visible: true });
}
