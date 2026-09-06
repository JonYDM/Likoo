"use client"

import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
} from "@tanstack/react-query"
import {
  getArtist,
  getArtistAlbums,
  getMe,
  getMyPlaylists,
  getPlaylist,
  getPlaylistTracks,
  getRecentlyPlayed,
  getSavedTracks,
  getTopArtists,
  getTopTracks,
  searchTracks,
  type Paginated,
  type SpotifyArtist,
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
  topArtists: () => [...spotifyKeys.all, "topArtists"] as const,
  topTracks: () => [...spotifyKeys.all, "topTracks"] as const,
  recentlyPlayed: () => [...spotifyKeys.all, "recentlyPlayed"] as const,
  artist: (id: string) => [...spotifyKeys.all, "artist", id] as const,
  artistAlbums: (id: string) =>
    [...spotifyKeys.all, "artist", id, "albums"] as const,
}

/** Calcula el offset de la siguiente página, o undefined si ya no hay más. */
function nextOffset(lastPage: Paginated<unknown>): number | undefined {
  if (lastPage.next === null) return undefined
  return lastPage.offset + lastPage.limit
}

/**
 * Helper genérico para hooks de scroll infinito sobre resultados paginados de
 * Spotify. Encapsula el patrón repetido (enabled por token, initialPageParam,
 * getNextPageParam por offset) — evita duplicar ~15 líneas por hook.
 *
 * @param key       query key del hook.
 * @param fetchPage función que trae una página dado (accessToken, {limit, offset}).
 * @param options   extras: `enabled` adicional (p.ej. que haya query/id).
 */
function useSpotifyInfinite<T>(
  key: readonly unknown[],
  fetchPage: (
    accessToken: string,
    opts: { limit: number; offset: number },
  ) => Promise<Paginated<T>>,
  options: { enabled?: boolean } = {},
) {
  const { accessToken } = useAuth()
  const enabled = !!accessToken && (options.enabled ?? true)

  return useInfiniteQuery<
    Paginated<T>,
    Error,
    InfiniteData<Paginated<T>>,
    readonly unknown[],
    number
  >({
    queryKey: key,
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchPage(accessToken!, { limit: PAGE_SIZE, offset: pageParam }),
    getNextPageParam: nextOffset,
  })
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
  const trimmed = query.trim()
  return useSpotifyInfinite(
    spotifyKeys.search(trimmed),
    (token, opts) => searchTracks(token, trimmed, opts),
    { enabled: trimmed.length > 0 },
  )
}

/** "Tus me gusta" con scroll infinito. */
export function useSavedTracks() {
  return useSpotifyInfinite(spotifyKeys.savedTracks(), getSavedTracks)
}

/** Playlists del usuario con scroll infinito. */
export function useMyPlaylists() {
  return useSpotifyInfinite(spotifyKeys.myPlaylists(), getMyPlaylists)
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
  return useSpotifyInfinite(
    spotifyKeys.playlistTracks(playlistId),
    (token, opts) => getPlaylistTracks(token, playlistId, opts),
    { enabled: !!playlistId },
  )
}

/** Top artistas del usuario (para Home y estado vacío de Search). */
export function useTopArtists(limit = 10) {
  const { accessToken } = useAuth()

  return useQuery<SpotifyArtist[], Error>({
    queryKey: spotifyKeys.topArtists(),
    enabled: !!accessToken,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const page = await getTopArtists(accessToken!, { limit })
      return page.items
    },
  })
}

/** Top canciones del usuario (para Home). */
export function useTopTracks(limit = 10) {
  const { accessToken } = useAuth()

  return useQuery<SpotifyTrack[], Error>({
    queryKey: spotifyKeys.topTracks(),
    enabled: !!accessToken,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const page = await getTopTracks(accessToken!, { limit })
      return page.items
    },
  })
}

/** Escuchado recientemente (para Home). */
export function useRecentlyPlayed(limit = 20) {
  const { accessToken } = useAuth()

  return useQuery<SpotifyTrack[], Error>({
    queryKey: spotifyKeys.recentlyPlayed(),
    enabled: !!accessToken,
    // Los recientes cambian seguido; cache corta.
    staleTime: 60 * 1000,
    queryFn: () => getRecentlyPlayed(accessToken!, { limit }),
  })
}

/** Detalle de un artista. */
export function useArtist(artistId: string) {
  const { accessToken } = useAuth()

  return useQuery<SpotifyArtist, Error>({
    queryKey: spotifyKeys.artist(artistId),
    enabled: !!accessToken && !!artistId,
    queryFn: () => getArtist(accessToken!, artistId),
  })
}

/** Álbumes de un artista con scroll infinito. */
export function useArtistAlbums(artistId: string) {
  return useSpotifyInfinite(
    spotifyKeys.artistAlbums(artistId),
    (token, opts) => getArtistAlbums(token, artistId, opts),
    { enabled: !!artistId },
  )
}
