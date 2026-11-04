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

// ---------- Data uji Sprint 2 (absensi) ----------

import { zonedParts } from "../src/lib/time";

export const SCHOOL = { latitude: -6.17511, longitude: 106.865039 }; // lokasi seed, radius 100 m
export const E2E_CLASS = "XII E2E";
/** Siswa khusus tes absensi (username = NIS, password sama dengan akun seed). */
export const E2E_STUDENTS = ["9900001", "9900002", "9900003", "9900004", "9900005", "9900006", "9900007"];

const pad = (n: number) => String(n).padStart(2, "0");
const toHhmm = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** Waktu lokal sekolah sekarang. Tes absensi dilewati di dekat tengah malam. */
export function jakartaNow() {
  return zonedParts(new Date(), "Asia/Jakarta");
}
export const tooCloseToMidnight = () => {
  const { minutes } = jakartaNow();
  return minutes < 20 || minutes > 22 * 60 + 50;
};

/**
 * Menyiapkan kelas XII E2E: siswa uji dan jadwal guru1 yang sedang berlangsung
 * (mulai 10 menit lalu, selesai 60 menit lagi). Aman dipanggil berulang kali.
 */
export async function ensureLiveSchedule() {
  const { weekday, minutes } = jakartaNow();
  for (const [i, nis] of E2E_STUDENTS.entries()) {
    await db(
      `INSERT INTO users (username, password_hash, role)
       SELECT $1::text, password_hash, 'STUDENT' FROM users WHERE username = 'admin'
       ON CONFLICT (username) DO NOTHING`,
      [nis],
    );
    await db(
      `INSERT INTO students (user_id, nis, name, class_name)
       SELECT id, $1::text, $2::text, $3::text FROM users WHERE username = $1::text
       ON CONFLICT (nis) DO NOTHING`,
      [nis, `Siswa E2E ${i + 1}`, E2E_CLASS],
    );
  }
  const start = toHhmm(minutes - 10);
  const end = toHhmm(Math.min(minutes + 60, 23 * 60 + 59));
  const existing = await db<{ id: number }>("SELECT id FROM schedules WHERE class_name = $1 AND subject = 'Uji Absensi'", [E2E_CLASS]);
  if (existing.length) {
    await db("UPDATE schedules SET day = $1, start_time = $2, end_time = $3 WHERE id = $4", [weekday, start, end, existing[0].id]);
    return existing[0].id;
  }
  const [row] = await db<{ id: number }>(
    `INSERT INTO schedules (teacher_id, class_name, subject, day, start_time, end_time)
     SELECT t.id, $1, 'Uji Absensi', $2, $3, $4 FROM teachers t JOIN users u ON u.id = t.user_id WHERE u.username = 'guru1'
     RETURNING id`,
    [E2E_CLASS, weekday, start, end],
  );
  return row.id;
}

/** Token QR sesi terbaru untuk jadwal tertentu. */
export async function latestSessionToken(scheduleId: number) {
  const [row] = await db<{ id: number; qr_token: string }>(
    "SELECT id, qr_token FROM attendance_sessions WHERE schedule_id = $1 ORDER BY opened_at DESC LIMIT 1",
    [scheduleId],
  );
  return row;
}
