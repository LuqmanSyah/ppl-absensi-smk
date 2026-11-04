// Utilitas zona waktu. Database menyimpan UTC; jadwal pelajaran memakai jam lokal sekolah.

/** Selisih zona waktu terhadap UTC (dalam menit) pada instan tertentu, misalnya +420 untuk WIB. */
export function timezoneOffsetMinutes(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" }).formatToParts(instant);
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const match = name.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "-" ? -minutes : minutes;
}

export type ZonedNow = {
  /** Tanggal lokal "YYYY-MM-DD". */
  date: string;
  /** 1 = Senin ... 7 = Minggu (sama dengan schedules.day). */
  weekday: number;
  /** Menit sejak tengah malam waktu lokal. */
  minutes: number;
};

export function zonedParts(instant: Date, timeZone: string): ZonedNow {
  const local = new Date(instant.getTime() + timezoneOffsetMinutes(instant, timeZone) * 60_000);
  const jsDay = local.getUTCDay(); // 0 = Minggu
  return {
    date: local.toISOString().slice(0, 10),
    weekday: jsDay === 0 ? 7 : jsDay,
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
}

/** Tanggal lokal + jam lokal ("07:30") menjadi instan UTC. */
export function zonedToUtc(date: string, hhmm: string, timeZone: string) {
  const guess = new Date(`${date}T${hhmm}:00Z`);
  const offset = timezoneOffsetMinutes(guess, timeZone);
  return new Date(guess.getTime() - offset * 60_000);
}

/** Awal dan akhir (eksklusif) hari lokal dalam UTC, untuk query "hari ini". */
export function zonedDayRange(date: string, timeZone: string) {
  const start = zonedToUtc(date, "00:00", timeZone);
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = zonedToUtc(next.toISOString().slice(0, 10), "00:00", timeZone);
  return { start, end };
}

/** "07:30" -> 450 */
export function hhmmToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function formatTime(instant: Date, timeZone: string) {
  return new Intl.DateTimeFormat("id-ID", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false })
    .format(instant)
    .replace(".", ":");
}

export function formatDate(instant: Date, timeZone: string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  }).format(instant);
}
