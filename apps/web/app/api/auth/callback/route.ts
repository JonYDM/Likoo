import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error || !code || !state) {
    return NextResponse.redirect(new URL("/login?error=access_denied", request.url))
  }

  // Redirigimos a una página cliente que tiene acceso a sessionStorage
  const params = new URLSearchParams({ code, state })
  return NextResponse.redirect(new URL(`/auth/exchange?${params}`, request.url))
}
