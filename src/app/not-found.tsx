import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <span className="mb-2 flex size-16 items-center justify-center rounded-2xl bg-accent text-primary" aria-hidden>
        <SearchX className="size-8" />
      </span>
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Halaman yang Anda buka tidak ada, atau Anda tidak memiliki akses ke data tersebut.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-2" })}>
        Kembali ke beranda
      </Link>
    </main>
  );
}
