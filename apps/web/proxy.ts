import { NextRequest, NextResponse } from "next/server"

/**
 * Protección de rutas (Fase 1).
 *
 * En Next 16 la convención `middleware.ts` fue renombrada a `proxy.ts` y la
 * función a `proxy()`; el comportamiento es idéntico al middleware clásico.
 *
 * Regla simple: si no existe la cookie httpOnly `sp_refresh_token`, el usuario
 * no tiene sesión → se le redirige a /login. La presencia de la cookie es una
 * señal barata y suficiente para el gate de navegación; la validez real del
 * token la comprueba /api/auth/token (que devuelve 401 si el refresh falla).
 *
 * Rutas públicas (login, el flujo de callback/exchange y los propios endpoints
 * de auth) se excluyen abajo para no crear un bucle de redirecciones.
 */

// Prefijos accesibles sin sesión.
const PUBLIC_PATHS = ["/login", "/auth/exchange"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Los Route Handlers de auth deben ser siempre accesibles: son los que
  // establecen la sesión. El resto de /api queda cubierto por el matcher.
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
  const hasSession = Boolean(request.cookies.get("sp_refresh_token")?.value)

  // Sin sesión y ruta protegida → a login.
  if (!isPublic && !hasSession) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Con sesión y en /login → mándalo a la home (evita ver el login logueado).
  if (isPublic && hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  /**
   * Ejecuta el proxy en todo excepto:
   *  - _next/* (assets internos de Next, incluido el WebSocket del HMR en dev:
   *    /_next/hmr — si el proxy lo intercepta, rompe el hot-reload del navegador)
   *  - favicon.ico y archivos con extensión en /public
   *
   * Las API de auth se dejan pasar dentro de la función, no en el matcher,
   * porque el matcher no puede expresar "todo /api salvo /api/auth".
   */
  matcher: ["/((?!_next/|favicon.ico|.*\\..*).*)"],
}
