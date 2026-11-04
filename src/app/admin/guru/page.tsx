import type { Prisma } from "@/generated/prisma/client";
import { PageHeader } from "@/components/page-header";
import { AddButton, EditLink, EmptyRow, SearchBar, StatusBadge } from "@/components/data-list";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export default async function TeachersPage({ searchParams }: PageProps<"/admin/guru">) {
  await requireRole("ADMIN");
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const where: Prisma.TeacherWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { nip: { contains: query } },
          { user: { username: { contains: query, mode: "insensitive" } } },
        ],
      }
    : {};

  const teachers = await prisma.teacher.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      nip: true,
      name: true,
      user: { select: { username: true, isActive: true } },
      _count: { select: { schedules: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Data Guru"
        description={`${teachers.length} guru${query ? " sesuai pencarian" : ""}.`}
        action={<AddButton href="/admin/guru/baru" label="Tambah guru" />}
      />
      <SearchBar q={query} placeholder="Cari nama, NIP, atau username" />
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NIP</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Jadwal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.length === 0 && <EmptyRow colSpan={6}>Belum ada data guru.</EmptyRow>}
            {teachers.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono">{t.nip}</TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{t.user.username}</TableCell>
                <TableCell>{t._count.schedules}</TableCell>
                <TableCell>
                  <StatusBadge active={t.user.isActive} />
                </TableCell>
                <TableCell className="text-right">
                  <EditLink href={`/admin/guru/${t.id}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
