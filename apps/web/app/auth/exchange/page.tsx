"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function ExchangePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

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
      .then((res) => {
        if (!res.ok) throw new Error("token_exchange_failed")
        router.replace("/")
      })
      .catch(() => {
        router.replace("/login?error=token_exchange")
      })
  }, [searchParams, router])

  return <p>Iniciando sesión...</p>
}
