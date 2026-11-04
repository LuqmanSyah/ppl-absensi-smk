import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { E2E_DATABASE_URL, E2E_PORT } from "./e2e/env";

// Tes E2E memakai database terpisah (absensi_e2e) yang dikosongkan dan diisi seed
// setiap kali dijalankan, sehingga data development tidak tersentuh.
export default defineConfig({
  testDir: "./e2e",
  // Tes berbagi satu database, jadi dijalankan berurutan agar hasilnya bisa diprediksi.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    // Memakai hasil build production agar perilakunya sama dengan saat deploy.
    command: `npm run build && npx next start -p ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}/login`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: { DATABASE_URL: E2E_DATABASE_URL },
  },
});
