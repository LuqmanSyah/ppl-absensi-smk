import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/lib/dal";
import { ROLE_LABEL } from "@/lib/roles";

export function UserMenu({ user, compact = false }: { user: CurrentUser; compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="min-w-0 text-right">
        <p className="truncate text-sm font-medium">{user.name}</p>
        {!compact && <p className="text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</p>}
      </div>
      <form action={logout}>
        <Button type="submit" variant="outline" size="sm" aria-label="Keluar">
          <LogOut aria-hidden />
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </form>
    </div>
  );
}
