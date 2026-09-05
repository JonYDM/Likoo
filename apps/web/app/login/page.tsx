"use client"

import { Button } from "../../components/ui/Button"

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
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Likoo
        </h1>
           <div className="mx-auto h-1 w-12 rounded-full bg-primary" />

        <p className="text-sm text-muted">
          Conecta tu cuenta para empezar.
        </p>
      </div>
      <Button intent="primary" size="lg" onClick={handleLogin}>
        Conectar Spotify
      </Button>
    </main>
  )
}
