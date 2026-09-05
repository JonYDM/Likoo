import { Home, Search, Library, type LucideIcon } from "lucide-react"

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
]

/** ¿La ruta actual corresponde a este item? "/" es exacto; el resto por prefijo. */
export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}
