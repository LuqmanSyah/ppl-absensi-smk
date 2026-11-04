import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/dal";

export default async function Page() {
  const user = await requireRole("TEACHER");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Halo, {user.name}</CardTitle>
        <CardDescription>Sesi absensi dan daftar kehadiran akan tersedia di Sprint 2.</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
