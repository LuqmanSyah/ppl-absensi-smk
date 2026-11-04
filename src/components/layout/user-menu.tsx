import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Avatar } from "@/components/brand";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/lib/dal";
import { ROLE_LABEL } from "@/lib/roles";

export function UserMenu({ user, compact = false }: { user: CurrentUser; compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={user.name} className={compact ? "hidden sm:inline-flex" : undefined} />
      <div className="min-w-0 text-right sm:text-left">
        <p className="max-w-32 truncate text-sm font-semibold sm:max-w-48">{user.name}</p>
        {!compact && <p className="text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</p>}
      </div>
      <form action={logout}>
        <Button type="submit" variant="ghost" size="sm" aria-label="Keluar" className="text-muted-foreground">
          <LogOut aria-hidden />
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </form>
    </div>
  );
}
