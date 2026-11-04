import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { ShellFallback } from "@/components/layout/shell-fallback";
import { requireRole } from "@/lib/dal";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}

async function Guard({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN");
  return <AdminShell user={user}>{children}</AdminShell>;
}
