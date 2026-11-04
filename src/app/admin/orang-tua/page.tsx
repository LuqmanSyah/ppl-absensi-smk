import type { Prisma } from "@/generated/prisma/client";
import { PageHeader } from "@/components/page-header";
import { AddButton, EditLink, EmptyRow, SearchBar, StatusBadge } from "@/components/data-list";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export default async function ParentsPage({ searchParams }: PageProps<"/admin/orang-tua">) {
  await requireRole("ADMIN");
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const where: Prisma.ParentWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { user: { username: { contains: query, mode: "insensitive" } } },
          { students: { some: { name: { contains: query, mode: "insensitive" } } } },
        ],
      }
    : {};

  const parents = await prisma.parent.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      user: { select: { username: true, isActive: true } },
      students: { select: { name: true, className: true }, orderBy: { name: "asc" } },
    },
  });

  return (
    <>
      <PageHeader
        title="Data Orang Tua"
        description="Hubungkan orang tua ke anaknya dari halaman ubah siswa."
        action={<AddButton href="/admin/orang-tua/baru" label="Tambah orang tua" />}
      />
      <SearchBar q={query} placeholder="Cari nama, username, atau nama anak" />
      <div className="surface overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Anak</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parents.length === 0 && <EmptyRow colSpan={5}>Belum ada data orang tua.</EmptyRow>}
            {parents.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{p.user.username}</TableCell>
                <TableCell className="whitespace-normal">
                  {p.students.length === 0
                    ? <span className="text-muted-foreground">Belum terhubung</span>
                    : p.students.map((s) => `${s.name} (${s.className})`).join(", ")}
                </TableCell>
                <TableCell>
                  <StatusBadge active={p.user.isActive} />
                </TableCell>
                <TableCell className="text-right">
                  <EditLink href={`/admin/orang-tua/${p.id}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
