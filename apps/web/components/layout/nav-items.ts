import { Home, Search, Library, Gamepad2, type LucideIcon } from "lucide-react"

/** Items de navegación, compartidos entre BottomNav (móvil) y SideNav (desktop). */
export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/search", label: "Buscar", icon: Search },
  { href: "/library", label: "Librería", icon: Library },
  { href: "/challenge", label: "Reto", icon: Gamepad2 },
]

/** ¿La ruta actual corresponde a este item? "/" es exacto; el resto por prefijo. */
export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}
