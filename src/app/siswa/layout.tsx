import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ShellFallback } from "@/components/layout/shell-fallback";
import { requireRole } from "@/lib/dal";

export default function SiswaLayout({ children }: LayoutProps<"/siswa">) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}

async function Guard({ children }: { children: React.ReactNode }) {
  const user = await requireRole("STUDENT");
  return <MobileShell user={user}>{children}</MobileShell>;
}
