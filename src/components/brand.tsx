import { ScanQrCode } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tanda merek aplikasi: ikon QR di kotak biru. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30",
        className,
      )}
      aria-hidden
    >
      <ScanQrCode className="size-5" />
    </span>
  );
}

/** Logo lengkap: tanda merek dan nama aplikasi. */
export function Brand({ subtitle = "SMK Putra Perdana", className }: { subtitle?: string; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <BrandMark />
      <div className="min-w-0 leading-tight">
        <p className="truncate font-bold">Absensi Digital</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

/** Inisial nama untuk avatar, misalnya "Rizky Wijaya" menjadi "RW". */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground",
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
