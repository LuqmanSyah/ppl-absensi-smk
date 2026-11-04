// Konfigurasi bersama untuk tes E2E.
export const E2E_PORT = 3200;

function e2eDatabaseUrl() {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("DATABASE_URL belum diisi di .env");
  const url = new URL(base);
  url.pathname = "/absensi_e2e";
  return url.toString();
}

export const E2E_DATABASE_URL = e2eDatabaseUrl();
export const PASSWORD = "password123"; // password akun seed
