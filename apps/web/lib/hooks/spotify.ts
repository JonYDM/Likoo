"use client"

import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
} from "@tanstack/react-query"
import {
  getMe,
  getMyPlaylists,
  getPlaylist,
  getPlaylistTracks,
  getSavedTracks,
  searchTracks,
  type Paginated,
  type SpotifyPlaylist,
  type SpotifyTrack,
  type SpotifyUser,
} from "@spotify-clone/shared"
import { useAuth } from "../auth-context"

/**
 * Hooks de datos de Spotify (Fase 2).
 *
 * Todos leen el accessToken del AuthContext y quedan deshabilitados
 * (`enabled`) hasta tenerlo, así nunca disparan una petición sin auth.
 *
 * Las listas potencialmente grandes (búsqueda, librería, tracks de playlist)
 * usan useInfiniteQuery para cargar página a página — clave en dispositivos con
 * pocos recursos: no traemos cientos de items ni los renderizamos de golpe.
 */

/**
 * Tamaño de página. Spotify limitó /search a máximo 10 en Development Mode
 * (cambio de febrero 2026). Usamos 10 de forma consistente en todos los hooks
 * para respetar ese tope y mantener páginas ligeras (menos peso por carga).
 */
const PAGE_SIZE = 10

// Query keys centralizadas → invalidación y cache predecibles.
export const spotifyKeys = {
  all: ["spotify"] as const,
  me: () => [...spotifyKeys.all, "me"] as const,
  search: (q: string) => [...spotifyKeys.all, "search", q] as const,
  savedTracks: () => [...spotifyKeys.all, "savedTracks"] as const,
  myPlaylists: () => [...spotifyKeys.all, "myPlaylists"] as const,
  playlist: (id: string) => [...spotifyKeys.all, "playlist", id] as const,
  playlistTracks: (id: string) =>
    [...spotifyKeys.all, "playlist", id, "tracks"] as const,
}

/** Calcula el offset de la siguiente página, o undefined si ya no hay más. */
function nextOffset(lastPage: Paginated<unknown>): number | undefined {
  if (lastPage.next === null) return undefined
  return lastPage.offset + lastPage.limit
}

/** Perfil del usuario actual (para saludo, avatar). */
export function useMe() {
  const { accessToken } = useAuth()

  return useQuery<SpotifyUser, Error>({
    queryKey: spotifyKeys.me(),
    enabled: !!accessToken,
    queryFn: () => getMe(accessToken!),
    staleTime: 30 * 60 * 1000, // el perfil casi no cambia → cache larga
  })
}

/**
 * Búsqueda de tracks con scroll infinito.
 * `query` vacío deja el hook deshabilitado (no busca por nada).
 */
export function useSearchTracks(query: string) {
  const { accessToken } = useAuth()
  const trimmed = query.trim()

  return useInfiniteQuery<
    Paginated<SpotifyTrack>,
    Error,
    InfiniteData<Paginated<SpotifyTrack>>,
    ReturnType<typeof spotifyKeys.search>,
    number
  >({
    queryKey: spotifyKeys.search(trimmed),
    enabled: !!accessToken && trimmed.length > 0,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      searchTracks(accessToken!, trimmed, {
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    getNextPageParam: nextOffset,
  })
}

/** "Tus me gusta" con scroll infinito. */
export function useSavedTracks() {
  const { accessToken } = useAuth()

  return useInfiniteQuery<
    Paginated<SpotifyTrack>,
    Error,
    InfiniteData<Paginated<SpotifyTrack>>,
    ReturnType<typeof spotifyKeys.savedTracks>,
    number
  >({
    queryKey: spotifyKeys.savedTracks(),
    enabled: !!accessToken,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getSavedTracks(accessToken!, { limit: PAGE_SIZE, offset: pageParam }),
    getNextPageParam: nextOffset,
  })
}

/** Playlists del usuario con scroll infinito. */
export function useMyPlaylists() {
  const { accessToken } = useAuth()

  return useInfiniteQuery<
    Paginated<SpotifyPlaylist>,
    Error,
    InfiniteData<Paginated<SpotifyPlaylist>>,
    ReturnType<typeof spotifyKeys.myPlaylists>,
    number
  >({
    queryKey: spotifyKeys.myPlaylists(),
    enabled: !!accessToken,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getMyPlaylists(accessToken!, { limit: PAGE_SIZE, offset: pageParam }),
    getNextPageParam: nextOffset,
  })
}

/** Detalle de una playlist (una sola petición, no paginada). */
export function usePlaylist(playlistId: string) {
  const { accessToken } = useAuth()

  return useQuery<SpotifyPlaylist, Error>({
    queryKey: spotifyKeys.playlist(playlistId),
    enabled: !!accessToken && !!playlistId,
    queryFn: () => getPlaylist(accessToken!, playlistId),
  })
}

/** Tracks de una playlist con scroll infinito. */
export function usePlaylistTracks(playlistId: string) {
  const { accessToken } = useAuth()

  return useInfiniteQuery<
    Paginated<SpotifyTrack>,
    Error,
    InfiniteData<Paginated<SpotifyTrack>>,
    ReturnType<typeof spotifyKeys.playlistTracks>,
    number
  >({
    queryKey: spotifyKeys.playlistTracks(playlistId),
    enabled: !!accessToken && !!playlistId,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getPlaylistTracks(accessToken!, playlistId, {
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    getNextPageParam: nextOffset,
  })
}
