import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/dal";

export default async function Page() {
  const user = await requireRole("STUDENT");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Halo, {user.name}</CardTitle>
        <CardDescription>Scan QR untuk absen dan riwayat kehadiran akan tersedia di Sprint 2.</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
