import { execSync } from "node:child_process";
import { Client } from "pg";
import { E2E_DATABASE_URL } from "./env";

// Membuat ulang database absensi_e2e dari nol: migrasi lalu seed.
export default async function globalSetup() {
  const target = new URL(E2E_DATABASE_URL);
  const dbName = target.pathname.slice(1);
  if (dbName !== "absensi_e2e") throw new Error(`Menolak mereset database "${dbName}"`);

  const admin = new URL(E2E_DATABASE_URL);
  admin.pathname = "/postgres";
  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  await client.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
  await client.query(`CREATE DATABASE ${dbName}`);
  await client.end();

  const env = { ...process.env, DATABASE_URL: E2E_DATABASE_URL };
  execSync("npx prisma migrate deploy", { env, stdio: "ignore" });
  execSync("npx prisma db seed", { env, stdio: "ignore" });
}
