import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ShellFallback } from "@/components/layout/shell-fallback";
import { requireRole } from "@/lib/dal";

export default function OrangTuaLayout({ children }: LayoutProps<"/orang-tua">) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}

async function Guard({ children }: { children: React.ReactNode }) {
  const user = await requireRole("PARENT");
  return <MobileShell user={user}>{children}</MobileShell>;
}
