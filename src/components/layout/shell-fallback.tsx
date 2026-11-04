/** Tampilan sementara selama sesi pengguna diperiksa. */
export function ShellFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-10" role="status" aria-live="polite">
      <p className="text-sm text-muted-foreground">Memuat...</p>
    </div>
  );
}
