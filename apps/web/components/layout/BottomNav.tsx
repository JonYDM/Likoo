"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "../../lib/cn"
import { NAV_ITEMS, isActive } from "./nav-items"

/**
 * Navegación móvil: píldora flotante centrada abajo, SOLO ICONOS.
 * Se oculta en desktop vía la prop className (`md:hidden`) desde <Nav/>.
 * Blur moderado (backdrop-blur, no -xl) para no castigar dispositivos flojos.
 */
export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full",
        "border border-border bg-surface/80 p-2 shadow-lg backdrop-blur",
        className,
      )}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center justify-center rounded-full p-3 transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:bg-surface-hover hover:text-foreground",
            )}
          >
            <Icon size={22} />
          </Link>
        )
      })}
    </nav>
  )
}
