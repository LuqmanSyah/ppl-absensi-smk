import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/data-list";
import { ConfirmActionButton } from "@/components/form/confirm-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/params";
import { mapsUrl } from "@/lib/maps";
import { deleteLocation, updateLocation } from "../actions";
import { LocationForm } from "../location-form";

export default async function EditLocationPage({ params }: PageProps<"/admin/lokasi/[id]">) {
  await requireRole("ADMIN");
  const id = parseId((await params).id);
  if (!id) notFound();

  const location = await prisma.schoolLocation.findUnique({ where: { id } });
  if (!location) notFound();
  const latitude = location.latitude.toString();
  const longitude = location.longitude.toString();

  return (
    <>
      <BackLink href="/admin/lokasi" label="Lokasi sekolah" />
      <PageHeader
        title={location.name}
        action={
          <a href={mapsUrl(latitude, longitude)} target="_blank" rel="noopener noreferrer" className="text-sm underline underline-offset-4">
            Buka di Google Maps
          </a>
        }
      />
      <div className="flex flex-col gap-6">
        <LocationForm
          action={updateLocation.bind(null, id)}
          location={{ name: location.name, latitude, longitude, radiusM: location.radiusM, isActive: location.isActive }}
        />
        {!location.isActive && (
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="text-base">Hapus lokasi</CardTitle>
              <CardDescription>Lokasi yang tidak dipakai boleh dihapus.</CardDescription>
            </CardHeader>
            <CardContent>
              <ConfirmActionButton
                action={deleteLocation.bind(null, id)}
                label="Hapus lokasi"
                confirmLabel="Hapus lokasi ini?"
                variant="destructive"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
