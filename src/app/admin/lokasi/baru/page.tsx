import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/data-list";
import { requireRole } from "@/lib/dal";
import { createLocation } from "../actions";
import { LocationForm } from "../location-form";

export default async function NewLocationPage() {
  await requireRole("ADMIN");
  return (
    <>
      <BackLink href="/admin/lokasi" label="Lokasi sekolah" />
      <PageHeader title="Tambah Lokasi" />
      <LocationForm action={createLocation} />
    </>
  );
}
