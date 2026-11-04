import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AddButton, EditLink, EmptyRow } from "@/components/data-list";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { mapsUrl } from "@/lib/maps";

export default async function LocationsPage() {
  await requireRole("ADMIN");
  const locations = await prisma.schoolLocation.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] });
  const hasActive = locations.some((l) => l.isActive);

  return (
    <>
      <PageHeader
        title="Lokasi Sekolah"
        description="Titik dan radius untuk validasi lokasi (geofencing) saat siswa absen."
        action={<AddButton href="/admin/lokasi/baru" label="Tambah lokasi" />}
      />
      {!hasActive && (
        <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          Belum ada lokasi aktif. Siswa tidak akan bisa absen sampai satu lokasi diaktifkan.
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Koordinat</TableHead>
              <TableHead>Radius</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 && <EmptyRow colSpan={5}>Belum ada lokasi.</EmptyRow>}
            {locations.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.name}</TableCell>
                <TableCell>
                  <a
                    href={mapsUrl(l.latitude.toString(), l.longitude.toString())}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs underline underline-offset-4"
                  >
                    {l.latitude.toString()}, {l.longitude.toString()}
                    <ExternalLink className="size-3" aria-hidden />
                    <span className="sr-only">(buka di Google Maps)</span>
                  </a>
                </TableCell>
                <TableCell className="tabular-nums">{l.radiusM} m</TableCell>
                <TableCell>
                  {l.isActive ? <Badge>Aktif</Badge> : <Badge variant="outline">Tidak dipakai</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <EditLink href={`/admin/lokasi/${l.id}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
