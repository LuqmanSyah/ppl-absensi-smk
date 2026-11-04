import { LoaderCircle } from "lucide-react";

/** Tampilan sementara selama sesi pengguna diperiksa. */
export function ShellFallback() {
  return (
    <div className="flex flex-1 items-center justify-center gap-2 p-10" role="status" aria-live="polite">
      <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">Memuat...</p>
    </div>
  );
}
