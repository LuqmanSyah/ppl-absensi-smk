import type { ReactNode } from "react";
import type { CurrentUser } from "@/lib/dal";
import { ROLE_LABEL } from "@/lib/roles";
import { NAV_ITEMS } from "./nav-config";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

/** Layout mobile-first untuk Guru, Siswa, dan Orang Tua: header atas dan navigasi bawah. */
export function MobileShell({ user, children }: { user: CurrentUser; children: ReactNode }) {
  const hasBottomNav = NAV_ITEMS[user.role].length > 1;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div>
          <p className="font-semibold">Absensi Digital</p>
          <p className="text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</p>
        </div>
        <UserMenu user={user} compact />
      </header>

      <main className={hasBottomNav ? "flex-1 px-4 py-6 pb-24" : "flex-1 px-4 py-6"}>{children}</main>

      {hasBottomNav && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-background pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto max-w-2xl">
            <NavLinks role={user.role} variant="bottom" />
          </div>
        </div>
      )}
    </div>
  );
}
