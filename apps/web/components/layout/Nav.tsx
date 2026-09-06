"use client"

import { usePathname } from "next/navigation"
import { BottomNav } from "./BottomNav"
import { SideNav } from "./SideNav"

/**
 * Orquesta la navegación responsiva:
 *  - Móvil: <BottomNav> (píldora de iconos abajo).
 *  - Desktop (md+): <SideNav> (menú de texto a la izquierda).
 *
 * Ambos existen en el DOM; el breakpoint decide cuál se muestra (hidden/flex).
 * No se renderiza en rutas de auth (login / exchange), donde no hay sesión.
 */
export function Nav() {
  const pathname = usePathname()

  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return null
  }

  return (
    <>
      <BottomNav className="flex lg:hidden" />
      <SideNav className="hidden lg:flex" />
    </>
  )
}
