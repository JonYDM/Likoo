"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { cn } from "../../lib/cn"
import { useAuth } from "../../lib/auth-context"
import { NAV_ITEMS, isActive } from "./nav-items"

/**
 * Navegación desktop: menú vertical flotante, cercano al contenido.
 *
 * - Texto grande (4xl) y bold, estilo "menú de juego".
 * - Cada item toma forma de PÍLDORA al hacer hover.
 * - Item activo: píldora con fondo azul metálico sutil + texto brillante.
 * - Al hover aparece el icono junto al texto (opacidad, sin mover el layout).
 * - Al fondo, separado, la acción secundaria "Cerrar sesión".
 *
 * Sin backdrop-blur ni glass: solo color y opacidad → cero coste de repintado.
 * Se oculta en móvil vía className (`hidden md:flex`) desde <Nav/>.
 */
export function SideNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  async function handleLogout() {
    await logout()
    router.replace("/login")
  }

  return (
    <nav
      className={cn(
        "fixed left-16 top-1/2 z-20 -translate-y-1/2 flex-col gap-3",
        className,
      )}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-full px-5 py-2 text-4xl font-bold tracking-tight",
              "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary/15 text-foreground"
                : "text-muted hover:bg-surface-hover hover:text-foreground",
            )}
          >
            <Icon
              size={26}
              className={cn(
                "shrink-0 transition-opacity duration-200",
                active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            />
            <span>{label}</span>
          </Link>
        )
      })}

      {/* Acción secundaria, separada del bloque de navegación */}
      <button
        type="button"
        onClick={handleLogout}
        className={cn(
          "group mt-6 flex items-center gap-3 rounded-full px-5 py-2 text-lg font-medium",
          "text-muted outline-none transition-colors",
          "hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <LogOut
          size={18}
          className="shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        />
        <span>Cerrar sesión</span>
      </button>
    </nav>
  )
}
