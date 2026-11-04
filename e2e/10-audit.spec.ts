// Audit log (S1-09). Dijalankan terakhir karena memeriksa jejak dari tes sebelumnya.
import { expect, test } from "@playwright/test";
import { db } from "./helpers";

test("G-01..09 aksi penting tercatat tanpa data rahasia", async () => {
  const rows = await db<{ action: string }>("SELECT DISTINCT action FROM audit_logs");
  const actions = rows.map((r) => r.action);
  for (const expected of [
    "LOGIN",
    "LOGIN_FAILED",
    "LOGOUT",
    "STUDENT_CREATE",
    "STUDENT_UPDATE",
    "STUDENT_IMPORT",
    "STUDENT_DEACTIVATE",
    "STUDENT_ACTIVATE",
    "TEACHER_CREATE",
    "TEACHER_DEACTIVATE",
    "PARENT_CREATE",
    "PARENT_DEACTIVATE",
    "SCHEDULE_CREATE",
    "SCHEDULE_UPDATE",
    "SCHEDULE_DELETE",
    "LOCATION_CREATE",
    "LOCATION_UPDATE",
    "LOCATION_DELETE",
  ]) {
    expect(actions, `aksi ${expected} harus tercatat`).toContain(expected);
  }

  const [update] = await db<{ detail: { before: unknown; after: unknown } }>(
    "SELECT detail FROM audit_logs WHERE action = 'STUDENT_UPDATE' LIMIT 1",
  );
  expect(update.detail).toHaveProperty("before");
  expect(update.detail).toHaveProperty("after");

  const leaks = await db("SELECT id FROM audit_logs WHERE detail::text ~* '(password\"\\s*:\\s*\"|\\$argon2|rahasia123|passwordbaru1)'");
  expect(leaks, "detail audit log tidak boleh berisi password atau hash").toHaveLength(0);

  const [login] = await db<{ ip_address: string | null }>("SELECT ip_address FROM audit_logs WHERE action = 'LOGIN' LIMIT 1");
  expect(login.ip_address).toBeTruthy();
});
