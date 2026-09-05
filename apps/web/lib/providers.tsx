"use client"

import { useState } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { makeQueryClient } from "./query-client"
import { AuthProvider } from "./auth-context"
import { PlayerProvider } from "./player-provider"

/**
 * Providers globales de la app.
 *
 * El QueryClient se crea una sola vez por instancia de cliente con
 * useState(initializer) — en el App Router esto evita recrearlo en cada render
 * y evita compartir estado entre requests en el servidor.
 *
 * Orden: QueryClient → Auth → Player. El PlayerProvider va DENTRO de Auth
 * porque el Web Playback SDK necesita el accessToken del AuthContext.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PlayerProvider>{children}</PlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
