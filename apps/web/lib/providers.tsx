"use client"

import { useState } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { makeQueryClient } from "./query-client"
import { AuthProvider } from "./auth-context"

/**
 * Providers globales de la app (Fase 2).
 *
 * El QueryClient se crea una sola vez por instancia de cliente con
 * useState(initializer) — en el App Router esto evita recrearlo en cada render
 * y evita compartir estado entre requests en el servidor.
 *
 * AuthProvider va DENTRO del QueryClientProvider por si en el futuro algún
 * efecto de auth quiere invalidar queries al hacer login/logout.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
