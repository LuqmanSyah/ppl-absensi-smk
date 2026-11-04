import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
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
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur-md">
        <Brand subtitle={ROLE_LABEL[user.role]} />
        <UserMenu user={user} compact />
      </header>

      <main className={hasBottomNav ? "flex-1 px-4 py-6 pb-28" : "flex-1 px-4 py-6"}>{children}</main>

      {hasBottomNav && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-8px_rgb(0_0_0/0.08)] backdrop-blur-md">
          <div className="mx-auto max-w-2xl px-2">
            <NavLinks role={user.role} variant="bottom" />
          </div>
        </div>
      )}
    </div>
  );
}
