// Komponen bersama untuk halaman daftar data master.
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, Pencil, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { selectClassName } from "@/lib/styles";

export function AddButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={buttonVariants()}>
      <Plus aria-hidden />
      {label}
    </Link>
  );
}

export function EditLink({ href }: { href: string }) {
  return (
    <Link href={href} className={buttonVariants({ variant: "outline", size: "sm" })}>
      <Pencil aria-hidden />
      Ubah
    </Link>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return active ? <Badge variant="success">Aktif</Badge> : <Badge variant="destructive">Nonaktif</Badge>;
}

/** Form pencarian memakai GET, sehingga hasil pencarian bisa di-bookmark dan dibagikan. */
export function SearchBar({
  q,
  placeholder,
  filter,
}: {
  q?: string;
  placeholder: string;
  filter?: { name: string; value?: string; label: string; options: string[] };
}) {
  return (
    <form method="get" className="mb-4 flex flex-wrap gap-2" role="search">
      <div className="relative min-w-48 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input name="q" defaultValue={q} placeholder={placeholder} aria-label={placeholder} className="pl-9" />
      </div>
      {filter && (
        <select
          name={filter.name}
          defaultValue={filter.value ?? ""}
          aria-label={filter.label}
          className={`${selectClassName} w-auto`}
        >
          <option value="">{filter.label}: semua</option>
          {filter.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
      <button type="submit" className={buttonVariants({ variant: "outline" })}>
        Cari
      </button>
    </form>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-sm text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
    >
      <ChevronLeft className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
