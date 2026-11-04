// Kolom `time` di Prisma bertipe DateTime; hanya jam dan menit (UTC) yang dipakai.

export const DAY_LABELS: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

/** "07:30" -> Date 1970-01-01T07:30:00Z */
export function timeToDate(hhmm: string) {
  return new Date(`1970-01-01T${hhmm}:00Z`);
}

/** Date -> "07:30" */
export function dateToTime(date: Date) {
  return date.toISOString().slice(11, 16);
}
