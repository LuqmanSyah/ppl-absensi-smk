import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { loginLockState } from "./login-throttle";

const now = new Date("2026-11-04T08:00:00Z");
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);

describe("pembatasan percobaan login (5 kali dalam 15 menit)", () => {
  test("4 kali gagal belum dikunci", () => {
    assert.deepEqual(loginLockState([1, 2, 3, 4].map(minutesAgo), now, 5, 15), { locked: false });
  });

  test("5 kali gagal dikunci sampai kegagalan tertua keluar dari jendela", () => {
    assert.deepEqual(loginLockState([1, 2, 3, 4, 5].map(minutesAgo), now, 5, 15), {
      locked: true,
      retryAfterMinutes: 10,
    });
  });

  test("kegagalan di luar 15 menit tidak dihitung", () => {
    assert.deepEqual(loginLockState([1, 2, 3, 4, 16].map(minutesAgo), now, 5, 15), { locked: false });
  });

  test("lebih dari 5 kali: waktu tunggu dihitung dari 5 kegagalan terbaru", () => {
    assert.deepEqual(loginLockState([14, 1, 2, 3, 4, 13].map(minutesAgo), now, 5, 15), {
      locked: true,
      retryAfterMinutes: 2,
    });
  });

  test("waktu tunggu minimal 1 menit", () => {
    const failures = [0.1, 0.2, 0.3, 0.4, 14.9].map(minutesAgo);
    assert.deepEqual(loginLockState(failures, now, 5, 15), { locked: true, retryAfterMinutes: 1 });
  });
});
