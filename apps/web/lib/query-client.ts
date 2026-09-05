import { QueryClient } from "@tanstack/react-query"

/**
 * Fábrica del QueryClient (Fase 2).
 *
 * Defaults pensados para rendimiento en dispositivos con pocos recursos:
 *  - staleTime alto: los datos de Spotify (playlists, librería) no cambian a
 *    cada segundo. Marcarlos "frescos" 5 min evita re-fetches innecesarios.
 *  - gcTime moderado: libera de memoria las queries inactivas tras 10 min.
 *  - refetchOnWindowFocus off: no re-piden datos cada vez que vuelves a la
 *    pestaña → menos red, menos CPU, menos batería.
 *  - retry acotado: 1 reintento (evita tormentas de peticiones en redes malas).
 *    Nunca reintentamos un 401: es sesión expirada, hay que reautenticar.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 min
        gcTime: 10 * 60 * 1000, // 10 min
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // No reintentar errores de auth: requieren reautenticación, no retry.
          if (error instanceof Error && "status" in error) {
            const status = (error as { status?: number }).status
            if (status === 401 || status === 403) return false
          }
          return failureCount < 1
        },
      },
    },
  })
}
