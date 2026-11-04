import { requireRole } from "@/lib/dal";
import { config } from "@/lib/config";
import { AttendanceFlow } from "./attendance-flow";

export default async function StudentAttendancePage({ searchParams }: PageProps<"/siswa/absen">) {
  await requireRole("STUDENT");
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Absen</h1>
        <p className="text-sm text-muted-foreground">
          Pastikan Anda berada di area sekolah dan GPS aktif. Akurasi lokasi minimal {config.maxGpsAccuracyM} m.
        </p>
      </div>
      <AttendanceFlow initialToken={token} />
    </div>
  );
}
