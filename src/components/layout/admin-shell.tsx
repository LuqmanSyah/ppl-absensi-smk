import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import type { CurrentUser } from "@/lib/dal";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

/** Layout Admin/TU: sidebar di layar lebar, menu geser horizontal di HP. */
export function AdminShell({ user, children }: { user: CurrentUser; children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col gap-6 border-r bg-sidebar px-3 py-5 md:flex">
        <Brand className="px-2" />
        <div className="flex flex-col gap-2">
          <p className="px-3 text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase" aria-hidden>
            Menu
          </p>
          <NavLinks role={user.role} variant="sidebar" />
        </div>
        <p className="mt-auto px-3 text-xs text-muted-foreground">Absensi QR Code dan GPS · SMK Putra Perdana Indonesia</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex flex-col gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur-md md:px-8">
          <div className="flex items-center justify-between gap-4">
            <Brand className="md:hidden" subtitle="Admin TU" />
            <p className="hidden text-sm text-muted-foreground md:block">Panel Admin TU</p>
            <UserMenu user={user} />
          </div>
          <div className="-mx-4 px-4 md:hidden">
            <NavLinks role={user.role} variant="top" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
