import type { ReactNode } from "react";
import type { CurrentUser } from "@/lib/dal";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

/** Layout Admin/TU: sidebar di layar lebar, menu geser horizontal di HP. */
export function AdminShell({ user, children }: { user: CurrentUser; children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r bg-muted/30 p-4 md:flex">
        <div className="px-3">
          <p className="font-semibold">Absensi Digital</p>
          <p className="text-xs text-muted-foreground">SMK Putra Perdana</p>
        </div>
        <NavLinks role={user.role} variant="sidebar" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex flex-col gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-4">
            <p className="font-semibold md:hidden">Absensi Digital</p>
            <div className="ml-auto">
              <UserMenu user={user} />
            </div>
          </div>
          <div className="md:hidden">
            <NavLinks role={user.role} variant="top" />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
