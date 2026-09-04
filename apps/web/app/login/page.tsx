"use client"

async function handleLogin() {
  const res = await fetch("/api/auth/login")
  const { url, verifier, state } = await res.json()

  // Guardamos en sessionStorage — solo vive en esta pestaña, más fiable que
  // cookies en desarrollo con navegadores con protecciones estrictas (Brave)
  sessionStorage.setItem("sp_pkce_verifier", verifier)
  sessionStorage.setItem("sp_state", state)

  window.location.href = url
}

export default function LoginPage() {
  return (
    <main>
      <button onClick={handleLogin}>Conectar Spotify</button>
    </main>
  )
}
