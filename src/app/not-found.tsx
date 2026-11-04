import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Halaman yang Anda buka tidak ada, atau Anda tidak memiliki akses ke data tersebut.
      </p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Kembali ke beranda
      </Link>
    </main>
  );
}
