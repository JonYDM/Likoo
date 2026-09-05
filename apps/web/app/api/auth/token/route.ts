import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get("sp_refresh_token")?.value

  if (!refreshToken) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.json({ error: "refresh_failed" }, { status: 401 })
  }

  const tokens = await tokenRes.json()

  const response = NextResponse.json({
    accessToken: tokens.access_token,
    expiresIn: tokens.expires_in,
  })

  if (tokens.refresh_token) {
    response.cookies.set("sp_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 60,
    })
  }

  return response
}
