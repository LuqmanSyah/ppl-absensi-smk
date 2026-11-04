"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/generated/prisma/enums";
import { NAV_ITEMS } from "./nav-config";

type Variant = "sidebar" | "top" | "bottom";

function isActive(pathname: string, href: string, rootHref: string) {
  // Menu beranda hanya aktif jika path persis sama, menu lain juga aktif untuk sub-halaman.
  if (href === rootHref) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ role, variant }: { role: Role; variant: Variant }) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];
  const rootHref = items[0]?.href ?? "/";

  return (
    <nav
      aria-label="Navigasi utama"
      className={cn(
        variant === "sidebar" && "flex flex-col gap-1",
        variant === "top" && "flex gap-1 overflow-x-auto",
        variant === "bottom" && "grid auto-cols-fr grid-flow-col",
      )}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href, rootHref);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center rounded-md text-sm font-medium transition-colors",
              variant === "sidebar" && "gap-3 px-3 py-2",
              variant === "top" && "shrink-0 gap-2 px-3 py-1.5",
              variant === "bottom" && "flex-col gap-1 py-2 text-xs",
              active
                ? variant === "bottom"
                  ? "text-primary"
                  : "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className={variant === "bottom" ? "size-5" : "size-4"} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
