// Geofencing (FR-06): jarak dua titik di permukaan bumi dengan rumus Haversine.

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export type Point = { latitude: number; longitude: number };

/** Jarak dalam meter. */
export function haversineDistanceM(a: Point, b: Point) {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type LocationCheck =
  | { ok: true; distanceM: number }
  | { ok: false; reason: "ACCURACY"; accuracyM: number; maxAccuracyM: number }
  | { ok: false; reason: "OUTSIDE"; distanceM: number; radiusM: number };

/**
 * Memeriksa lokasi siswa terhadap lokasi sekolah.
 * Akurasi diperiksa lebih dulu: posisi dengan akurasi buruk tidak bisa dipercaya
 * walaupun titiknya kebetulan berada di dalam radius.
 */
export function checkLocation(
  position: Point & { accuracyM: number },
  school: Point & { radiusM: number },
  maxAccuracyM: number,
): LocationCheck {
  if (!(position.accuracyM <= maxAccuracyM)) {
    return { ok: false, reason: "ACCURACY", accuracyM: position.accuracyM, maxAccuracyM };
  }
  const distanceM = haversineDistanceM(position, school);
  if (distanceM > school.radiusM) {
    return { ok: false, reason: "OUTSIDE", distanceM, radiusM: school.radiusM };
  }
  return { ok: true, distanceM };
}
