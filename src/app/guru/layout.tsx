import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ShellFallback } from "@/components/layout/shell-fallback";
import { requireRole } from "@/lib/dal";

export default function GuruLayout({ children }: LayoutProps<"/guru">) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}

async function Guard({ children }: { children: React.ReactNode }) {
  const user = await requireRole("TEACHER");
  return <MobileShell user={user}>{children}</MobileShell>;
}
