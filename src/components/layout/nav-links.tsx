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
        variant === "top" && "flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]",
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
              "group/nav flex items-center text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              variant === "sidebar" && [
                "relative gap-3 rounded-lg px-3 py-2",
                active ? "bg-accent font-semibold text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ],
              variant === "top" && [
                "shrink-0 gap-2 rounded-full px-3 py-1.5",
                active ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25" : "bg-muted text-muted-foreground hover:text-foreground",
              ],
              variant === "bottom" && [
                "flex-col gap-1 rounded-lg py-2 text-[0.7rem]",
                active ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground",
              ],
            )}
          >
            {variant === "bottom" ? (
              <span
                className={cn(
                  "flex h-7 w-14 items-center justify-center rounded-full transition-colors",
                  active ? "bg-accent text-accent-foreground" : "group-hover/nav:bg-muted",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
            ) : (
              <Icon className={cn("size-4", variant === "sidebar" && active && "text-primary")} aria-hidden />
            )}
            {label}
            {variant === "sidebar" && active && (
              <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" aria-hidden />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
