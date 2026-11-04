import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/dal";

export default async function Page() {
  const user = await requireRole("PARENT");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Halo, {user.name}</CardTitle>
        <CardDescription>Riwayat kehadiran anak akan tersedia di Sprint 3.</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
