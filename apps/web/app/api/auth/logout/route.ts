import { NextResponse } from "next/server"

/**
 * Cierra la sesión borrando la cookie httpOnly de refresh token.
 *
 * El access_token vive solo en memoria en el AuthContext del cliente, así que
 * no hay nada que limpiar server-side aparte de la cookie de refresh. Tras esto
 * el siguiente GET /api/auth/token devolverá 401 y el middleware bloqueará
 * las rutas protegidas.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true })

  // maxAge: 0 expira la cookie de inmediato. Debe coincidir en path/atributos
  // con la cookie que se seteó en token-exchange para que el navegador la borre.
  response.cookies.set("sp_refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return response
}
