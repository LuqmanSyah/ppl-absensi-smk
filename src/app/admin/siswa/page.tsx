import type { Prisma } from "@/generated/prisma/client";
import { PageHeader } from "@/components/page-header";
import { AddButton, EditLink, EmptyRow, SearchBar, StatusBadge } from "@/components/data-list";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getClassNames } from "@/lib/queries/master-data";
import Link from "next/link";

const LIMIT = 200;

export default async function StudentsPage({ searchParams }: PageProps<"/admin/siswa">) {
  await requireRole("ADMIN");
  const { q, kelas } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const classFilter = typeof kelas === "string" ? kelas : "";

  const where: Prisma.StudentWhereInput = {
    ...(classFilter && { className: classFilter }),
    ...(query && {
      OR: [{ name: { contains: query, mode: "insensitive" } }, { nis: { contains: query } }],
    }),
  };

  const [students, total, classNames] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: [{ className: "asc" }, { name: "asc" }],
      take: LIMIT,
      select: {
        id: true,
        nis: true,
        name: true,
        className: true,
        parent: { select: { name: true } },
        user: { select: { isActive: true } },
      },
    }),
    prisma.student.count({ where }),
    getClassNames(),
  ]);

  return (
    <>
      <PageHeader
        title="Data Siswa"
        description={`${total} siswa${query || classFilter ? " sesuai pencarian" : ""}.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/siswa/impor" className={buttonVariants({ variant: "outline" })}>
              Impor CSV
            </Link>
            <AddButton href="/admin/siswa/baru" label="Tambah siswa" />
          </div>
        }
      />
      <SearchBar
        q={query}
        placeholder="Cari nama atau NIS"
        filter={{ name: "kelas", value: classFilter, label: "Kelas", options: classNames }}
      />
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NIS</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>Orang tua</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 && <EmptyRow colSpan={6}>Belum ada data siswa.</EmptyRow>}
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono">{s.nis}</TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.className}</TableCell>
                <TableCell className="text-muted-foreground">{s.parent?.name ?? "-"}</TableCell>
                <TableCell>
                  <StatusBadge active={s.user.isActive} />
                </TableCell>
                <TableCell className="text-right">
                  <EditLink href={`/admin/siswa/${s.id}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {total > LIMIT && (
        <p className="mt-3 text-sm text-muted-foreground">
          Menampilkan {LIMIT} dari {total} siswa. Persempit dengan pencarian atau filter kelas.
        </p>
      )}
    </>
  );
}
