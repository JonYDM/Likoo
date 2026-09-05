"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "../../../lib/auth-context"

/**
 * Contenido real del intercambio. Usa useSearchParams(), que en Next 15/16
 * obliga a un límite de Suspense en cliente (CSR bailout) — de ahí el wrapper
 * de abajo. Aquí se valida el `state` contra sessionStorage y se dispara el
 * intercambio server-side del `code` por tokens.
 */
function ExchangeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refresh } = useAuth()

  useEffect(() => {
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    const storedState = sessionStorage.getItem("sp_state")
    const verifier = sessionStorage.getItem("sp_pkce_verifier")

    if (!code || !state || !storedState || !verifier || state !== storedState) {
      router.replace("/login?error=invalid_state")
      return
    }

    // Limpiamos sessionStorage
    sessionStorage.removeItem("sp_pkce_verifier")
    sessionStorage.removeItem("sp_state")

    // Llamamos al endpoint que intercambia el code por tokens
    fetch("/api/auth/token-exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, verifier }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("token_exchange_failed")
        // La cookie ya existe: poblamos el token en memoria ANTES de navegar
        // para que la home no muestre "No autenticado" hasta un reload.
        await refresh()
        router.replace("/")
      })
      .catch(() => {
        router.replace("/login?error=token_exchange")
      })
  }, [searchParams, router, refresh])

  return <p>Iniciando sesión...</p>
}

export default function ExchangePage() {
  return (
    <Suspense fallback={<p>Iniciando sesión...</p>}>
      <ExchangeInner />
    </Suspense>
  )
}
