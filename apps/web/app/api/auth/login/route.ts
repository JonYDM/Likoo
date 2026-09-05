import { NextResponse } from "next/server"
import { generateCodeVerifier, generateCodeChallenge, generateState } from "@spotify-clone/shared"

export async function GET() {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateState()

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: "http://127.0.0.1:3000/api/auth/callback",
    // streaming + user-read-*: Web Playback SDK y perfil (Fase 3).
    // user-library-read: "Tus me gusta" (saved tracks).
    // playlist-read-private: playlists privadas del usuario. (Fase 2)
    scope:
      "streaming user-read-email user-read-private user-library-read playlist-read-private",
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
  })

  // Devolvemos verifier y state al cliente para que los guarde en sessionStorage
  // (más fiable que cookies en desarrollo con Brave/Chrome con protecciones estrictas)
  return NextResponse.json({
    url: `https://accounts.spotify.com/authorize?${params}`,
    verifier,
    state,
  })
}
