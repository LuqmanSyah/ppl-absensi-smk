import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { formatTime, zonedDayRange, zonedParts, zonedToUtc } from "./time";

const TZ = "Asia/Jakarta";

describe("zona waktu Asia/Jakarta (UTC+7)", () => {
  test("Senin 07:30 WIB = 00:30 UTC", () => {
    assert.equal(zonedToUtc("2026-11-02", "07:30", TZ).toISOString(), "2026-11-02T00:30:00.000Z");
  });

  test("Minggu 20:00 UTC sudah Senin dini hari di WIB", () => {
    assert.deepEqual(zonedParts(new Date("2026-11-01T20:00:00Z"), TZ), { date: "2026-11-02", weekday: 1, minutes: 180 });
  });

  test("rentang satu hari lokal", () => {
    const { start, end } = zonedDayRange("2026-11-02", TZ);
    assert.equal(start.toISOString(), "2026-11-01T17:00:00.000Z");
    assert.equal(end.toISOString(), "2026-11-02T17:00:00.000Z");
  });

  test("format jam lokal", () => {
    assert.equal(formatTime(new Date("2026-11-02T00:05:00Z"), TZ), "07:05");
  });
});
