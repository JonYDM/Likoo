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
    <main className="relative flex h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Resplandor de fondo (azul metálico) que da profundidad */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 40%, color-mix(in srgb, var(--color-ring) 25%, transparent), transparent 70%)",
        }}
      />

      <div className="flex flex-col items-center gap-8">
        {/* Logo LIKOO: letras que brillan y se apagan en onda */}
        <div
          aria-label="Likoo"
          className="flex gap-1 text-6xl font-black tracking-widest text-white"
        >
          {"LIKOO".split("").map((letter, i) => (
            <span
              key={i}
              className="animate-letter-glow"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              {letter}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          <div className="mx-auto h-1 w-12 rounded-full bg-primary" />
          <p className="max-w-xs text-muted">
            Tu música, con una identidad distinta. Conecta tu cuenta de Spotify
            para empezar.
          </p>
        </div>

        <Button intent="primary" size="lg" onClick={handleLogin}>
          Conectar con Spotify
        </Button>

        <p className="max-w-xs text-xs text-muted">
          Necesitas una cuenta de Spotify. Para reproducir audio, se requiere
          Premium.
        </p>
      </div>
    </main>
  )
}
