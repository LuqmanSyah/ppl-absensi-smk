import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { checkLocation, haversineDistanceM } from "./geo";

const school = { latitude: -6.17511, longitude: 106.865039, radiusM: 100 };

describe("haversineDistanceM", () => {
  test("titik yang sama berjarak 0", () => {
    assert.equal(haversineDistanceM(school, school), 0);
  });

  test("1 derajat lintang sekitar 111,2 km", () => {
    const d = haversineDistanceM({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
    assert.ok(Math.abs(d - 111_195) < 10, `jarak ${d}`);
  });

  test("Monas ke Bundaran HI sekitar 2,2 km", () => {
    const monas = { latitude: -6.1753924, longitude: 106.8271528 };
    const bundaranHI = { latitude: -6.1949, longitude: 106.823 };
    const d = haversineDistanceM(monas, bundaranHI);
    assert.ok(d > 2_000 && d < 2_400, `jarak ${d}`);
  });

  test("simetris", () => {
    const a = { latitude: -6.2, longitude: 106.8 };
    assert.equal(haversineDistanceM(a, school), haversineDistanceM(school, a));
  });
});

describe("checkLocation", () => {
  // 0,0005 derajat lintang = sekitar 55 m
  const near = { latitude: school.latitude + 0.0005, longitude: school.longitude };
  const far = { latitude: school.latitude + 0.002, longitude: school.longitude }; // sekitar 222 m

  test("di dalam radius dengan akurasi baik diterima", () => {
    const r = checkLocation({ ...near, accuracyM: 20 }, school, 50);
    assert.equal(r.ok, true);
    if (r.ok) assert.ok(r.distanceM > 50 && r.distanceM < 60);
  });

  test("di luar radius ditolak dengan jaraknya", () => {
    const r = checkLocation({ ...far, accuracyM: 10 }, school, 50);
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.reason, "OUTSIDE");
  });

  test("akurasi buruk ditolak walau titiknya di dalam radius", () => {
    const r = checkLocation({ ...school, accuracyM: 80 }, school, 50);
    assert.deepEqual(r, { ok: false, reason: "ACCURACY", accuracyM: 80, maxAccuracyM: 50 });
  });

  test("akurasi tepat di batas masih diterima", () => {
    assert.equal(checkLocation({ ...school, accuracyM: 50 }, school, 50).ok, true);
  });

  test("akurasi tidak valid (NaN) ditolak", () => {
    assert.equal(checkLocation({ ...school, accuracyM: Number.NaN }, school, 50).ok, false);
  });
});
