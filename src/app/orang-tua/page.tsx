import Link from "next/link";
import { notFound } from "next/navigation";
import { PeriodFilter } from "@/components/attendance/period-filter";
import { StudentHistory } from "@/components/attendance/student-history";
import { cn } from "@/lib/utils";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getStudentReport, parsePeriod } from "@/lib/attendance/report";
import { schoolNow } from "@/lib/attendance/server";

/** FR-14: orang tua memantau riwayat kehadiran anaknya sendiri. */
export default async function ParentHomePage({ searchParams }: PageProps<"/orang-tua">) {
  const user = await requireRole("PARENT");
  const children = await prisma.student.findMany({
    where: { parent: { userId: user.id } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, className: true },
  });

  const sp = await searchParams;
  const { from, to } = parsePeriod(sp.dari, sp.sampai, schoolNow().date);

  if (children.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Halo, {user.name}</h1>
        <p className="text-sm text-muted-foreground">
          Akun Anda belum terhubung dengan data siswa. Hubungi Admin TU sekolah untuk menghubungkan akun ke anak Anda.
        </p>
      </div>
    );
  }

  // Hanya anak yang terhubung ke akun ini yang boleh dibuka (skenario uji no. 12).
  const requested = typeof sp.anak === "string" ? Number(sp.anak) : children[0].id;
  const child = children.find((c) => c.id === requested);
  if (!child) notFound();

  const report = await getStudentReport(child.id, from, to);
  if (!report) notFound();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Halo, {user.name}</h1>
        <p className="text-sm text-muted-foreground">Riwayat kehadiran anak Anda.</p>
      </div>

      {children.length > 1 && (
        <nav className="flex flex-wrap gap-2" aria-label="Pilih anak">
          {children.map((c) => (
            <Link
              key={c.id}
              href={`/orang-tua?anak=${c.id}&dari=${from}&sampai=${to}`}
              aria-current={c.id === child.id ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm",
                c.id === child.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      )}

      <div>
        <h2 className="font-semibold" data-testid="child-name">
          {child.name}
        </h2>
        <p className="text-sm text-muted-foreground">Kelas {child.className}</p>
      </div>

      <PeriodFilter from={from} to={to} hidden={{ anak: String(child.id) }} />
      <StudentHistory report={report} />
    </div>
  );
}
