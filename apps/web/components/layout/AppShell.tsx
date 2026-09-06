"use client"

import { usePathname } from "next/navigation"
import { Nav } from "./Nav"
import { PlayerBar } from "../player/PlayerBar"

/**
 * Decide el layout según la ruta:
 *  - Rutas de auth (login / exchange): SOLO el contenido, a pantalla completa
 *    (sin grid, sin nav, sin reproductor). Así el login es una página limpia.
 *  - Resto de la app: grid de 3 columnas (nav · contenido · reproductor).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuth = pathname === "/login" || pathname.startsWith("/auth")

  if (isAuth) {
    return <div className="h-dvh">{children}</div>
  }

  return (
    <div className="h-dvh lg:grid lg:grid-cols-[minmax(12rem,16rem)_1fr_minmax(20rem,24rem)]">
      {/*
        Tinte de ambiente: capa fija detrás de TODO con el color de la canción
        actual (var(--album-color)). Muy sutil (solo se intuye) y con transición
        lenta al cambiar de canción. Si no hay canción, es transparente.
        pointer-events-none para no interferir.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 transition-[background] duration-1000 ease-out"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--album-color, transparent) 12%, transparent), transparent 70%)",
        }}
      />

      {/* Columna izquierda: navegación (desktop) */}
      <Nav />

      {/* Columna central: contenedor de altura fija SIN scroll propio.
          Cada página gestiona su scroll interno y su fade de borde derecho. */}
      <main className="h-dvh min-w-0 overflow-hidden">{children}</main>

      {/* Columna derecha: reproductor (desktop) */}
      <PlayerBar />
    </div>
  )
}
