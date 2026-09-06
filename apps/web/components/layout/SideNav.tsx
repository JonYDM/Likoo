"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { cn } from "../../lib/cn"
import { useAuth } from "../../lib/auth-context"
import { useMe } from "../../lib/hooks/spotify"
import { NAV_ITEMS, isActive } from "./nav-items"

/**
 * Navegación desktop: ocupa su columna del grid (no flota). Menú vertical
 * centrado, con "Cerrar sesión" abajo. Sticky a altura completa del viewport.
 * Se oculta en < lg vía className desde <Nav/>.
 */
export function SideNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const { data: me } = useMe()

  async function handleLogout() {
    await logout()
    router.replace("/login")
  }

  return (
    <nav
      className={cn(
        "sticky top-0 flex h-dvh flex-col px-8 py-8",
        className,
      )}
    >
      {/* Perfil del usuario: foto (o inicial) + nombre + cerrar sesión. El fondo
          es un gradiente lineal que usa la variable CSS global --album-color
          (que publica el player). CSS puro, sin estado React. */}
      <div
        className="flex items-center gap-3 rounded-2xl border border-border/50 p-3 transition-[background] duration-700"
        style={{
          background:
            "linear-gradient(to right, color-mix(in srgb, var(--album-color, transparent) 40%, transparent), transparent)",
        }}
      >
        {me?.images?.[0]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={me.images[0].url}
            alt=""
            className="h-14 w-14 shrink-0 rounded-full object-cover shadow-md"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {me?.displayName?.charAt(0).toUpperCase() ?? "?"}
          </div>
        )}
        <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
          {me?.displayName ?? "…"}
        </span>
        {/* Cerrar sesión: acción del usuario, vive junto a su perfil */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted outline-none transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Bloque de navegación: centrado verticalmente en el espacio superior */}
      <div className="flex flex-1 flex-col justify-center gap-3">
        {/* Items de navegación (icono + texto siempre) */}
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-2 text-2xl font-bold tracking-tight",
                "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              <Icon size={22} className="shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>

      {/* Logo LIKOO: pegado al fondo (mt-auto lo empuja), centrado, letras
          grandes que brillan y se apagan en onda. */}
      <div
        aria-label="Likoo"
        className="flex justify-center gap-1 text-4xl font-black tracking-widest text-white"
      >
        {"LIKOO".split("").map((letter, i) => (
          <span
            key={i}
            className="animate-letter-glow"
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            {letter}
          </span>
        ))}
      </div>
    </nav>
  )
}
