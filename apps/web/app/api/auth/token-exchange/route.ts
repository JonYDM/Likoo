import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const { code, verifier } = await request.json()

  if (!code || !verifier) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 })
  }

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "http://127.0.0.1:3000/api/auth/callback",
      client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
      code_verifier: verifier,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.json()
    console.error("Token exchange failed:", err)
    return NextResponse.json({ error: "token_exchange_failed" }, { status: 400 })
  }

  const tokens = await tokenRes.json()

  const response = NextResponse.json({ ok: true })

  response.cookies.set("sp_refresh_token", tokens.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  })

  return response
}
