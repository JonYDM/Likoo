"use client"

import { useQuery } from "@tanstack/react-query"
import { searchTracks, type GameTrack, type SpotifyTrack } from "@spotify-clone/shared"
import { useAuth } from "../auth-context"

/**
 * Carga el pool de canciones de un género para una partida del Reto.
 *
 * Rendimiento / rate limit: se pide UNA sola vez por género y queda cacheado
 * (staleTime largo). Como /search topa en 10 por página en dev mode, pedimos
 * 3 páginas (30 tracks) en paralelo para tener señuelos suficientes. El juego
 * NO vuelve a pedir nada durante la partida (todo se baraja en memoria).
 *
 * Filtra tracks sin uri (no reproducibles). Mapea a GameTrack (subset ligero).
 */

const POOL_PAGES = 3
const PAGE_SIZE = 10

function toGameTrack(t: SpotifyTrack): GameTrack {
  return {
    id: t.id,
    uri: t.uri,
    title: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    // Carátula GRANDE (images[0]): la misma resolución que usa el PlayerBar,
    // se ve nítida al revelar. Solo se muestra 1 por ronda (al revelar).
    imageUrl: t.album.images[0]?.url ?? t.album.images.at(-1)?.url,
  }
}

export function useGamePool(genre: string, enabled: boolean) {
  const { accessToken } = useAuth()

  return useQuery<GameTrack[], Error>({
    queryKey: ["game", "pool", genre],
    enabled: !!accessToken && enabled && !!genre,
    staleTime: 60 * 60 * 1000, // 1h: el pool de un género no cambia en la sesión
    queryFn: async () => {
      const query = `genre:${genre}`
      // Pedimos varias páginas en paralelo (una petición por offset).
      const pages = await Promise.all(
        Array.from({ length: POOL_PAGES }, (_, i) =>
          searchTracks(accessToken!, query, {
            limit: PAGE_SIZE,
            offset: i * PAGE_SIZE,
          }),
        ),
      )

      // Aplanar, quedarnos con reproducibles, y deduplicar por id.
      const seen = new Set<string>()
      const pool: GameTrack[] = []
      for (const page of pages) {
        for (const t of page.items) {
          if (!t.uri || seen.has(t.id)) continue
          seen.add(t.id)
          pool.push(toGameTrack(t))
        }
      }
      return pool
    },
  })
}
