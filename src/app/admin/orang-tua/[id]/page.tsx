import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/data-list";
import { AccountStatusCard } from "@/components/account-status-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/params";
import { updateParent } from "../actions";
import { ParentForm } from "../parent-form";

export default async function EditParentPage({ params }: PageProps<"/admin/orang-tua/[id]">) {
  await requireRole("ADMIN");
  const id = parseId((await params).id);
  if (!id) notFound();

  const parent = await prisma.parent.findUnique({
    where: { id },
    select: {
      name: true,
      user: { select: { id: true, username: true, isActive: true } },
      students: { select: { id: true, name: true, nis: true, className: true }, orderBy: { name: "asc" } },
    },
  });
  if (!parent) notFound();

  return (
    <>
      <BackLink href="/admin/orang-tua" label="Data orang tua" />
      <PageHeader title={parent.name} />
      <div className="flex flex-col gap-6">
        <ParentForm action={updateParent.bind(null, id)} parent={{ name: parent.name, username: parent.user.username }} />
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-base">Anak yang terhubung</CardTitle>
          </CardHeader>
          <CardContent>
            {parent.students.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada. Pilih orang tua ini di halaman ubah siswa untuk menghubungkan.
              </p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {parent.students.map((s) => (
                  <li key={s.id}>
                    <Link href={`/admin/siswa/${s.id}`} className="underline underline-offset-4">
                      {s.name}
                    </Link>{" "}
                    <span className="text-muted-foreground">
                      NIS {s.nis} · {s.className}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <AccountStatusCard userId={parent.user.id} username={parent.user.username} isActive={parent.user.isActive} />
      </div>
    </>
  );
}
