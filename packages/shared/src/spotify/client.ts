/**
 * Cliente de la Spotify Web API (Fase 2).
 *
 * Diseño (robusto pero ligero):
 *  - `spotifyFetch` centraliza auth, timeout y manejo de errores en un solo sitio.
 *  - El `accessToken` se pasa como argumento, NO se guarda: `packages/shared`
 *    queda agnóstico de dónde vive el token (web hoy, móvil mañana).
 *  - Se valida la ENVOLTURA paginada con zod una vez por página (detecta cambios
 *    estructurales de la API) pero los items se mapean con funciones simples,
 *    sin validación por elemento → sin coste O(n) de zod en listas grandes.
 */

import { z } from "zod"
import type {
  Paginated,
  RawAlbum,
  RawImage,
  RawPaginated,
  RawPlaylist,
  RawPlaylistTrackItem,
  RawSavedTrackItem,
  RawTrack,
  RawUser,
  SpotifyImage,
  SpotifyPlaylist,
  SpotifyTrack,
  SpotifyUser,
} from "./types"

const API_BASE = "https://api.spotify.com/v1"

/** Timeout por request para no colgar la UI en redes lentas. */
const REQUEST_TIMEOUT_MS = 10_000

/** Error tipado para que la UI pueda distinguir 401 (reautenticar) del resto. */
export class SpotifyApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "SpotifyApiError"
  }
}

// ---------------------------------------------------------------------------
// Validación de la envoltura paginada (una vez por página, no por item)
// ---------------------------------------------------------------------------

const paginatedEnvelopeSchema = z.object({
  items: z.array(z.unknown()),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  next: z.string().nullable(),
})

// ---------------------------------------------------------------------------
// Mappers crudo → limpio (asignación de campos, coste O(1) por item)
// ---------------------------------------------------------------------------

function mapImage(raw: RawImage): SpotifyImage {
  return { url: raw.url, width: raw.width, height: raw.height }
}

function mapTrack(raw: RawTrack): SpotifyTrack {
  return {
    id: raw.id,
    name: raw.name,
    uri: raw.uri,
    durationMs: raw.duration_ms,
    artists: raw.artists.map((a) => ({ id: a.id, name: a.name })),
    album: {
      id: raw.album.id,
      name: raw.album.name,
      images: raw.album.images.map(mapImage),
    },
  }
}

function mapPlaylist(raw: RawPlaylist): SpotifyPlaylist {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? null,
    images: raw.images?.map(mapImage) ?? [],
    owner: {
      id: raw.owner?.id ?? "",
      displayName: raw.owner?.display_name ?? "",
    },
    // El conteo puede venir en `tracks.total` (endpoint clásico) o `items.total`
    // (nuevo). Cubrimos ambos y damos 0 si no está.
    trackCount: raw.tracks?.total ?? raw.items?.total ?? 0,
  }
}

function mapUser(raw: RawUser): SpotifyUser {
  return {
    id: raw.id,
    displayName: raw.display_name,
    images: raw.images?.map(mapImage) ?? [],
  }
}

/**
 * Construye una `Paginated<T>` limpia a partir de la respuesta cruda,
 * validando la envoltura y mapeando cada item con `mapItem`.
 */
function mapPage<TRaw, TClean>(
  raw: RawPaginated<TRaw>,
  mapItem: (item: TRaw) => TClean,
): Paginated<TClean> {
  // Valida solo la forma de la envoltura (barato). Lanza si la API cambió.
  paginatedEnvelopeSchema.parse(raw)
  return {
    items: raw.items.map(mapItem),
    total: raw.total,
    limit: raw.limit,
    offset: raw.offset,
    next: raw.next,
  }
}

// ---------------------------------------------------------------------------
// Helper base de fetch autenticado
// ---------------------------------------------------------------------------

/**
 * Llamada autenticada a la Web API con timeout y manejo de errores.
 *
 * - Si `path` empieza por "http" se usa tal cual (para seguir `next` de la
 *   paginación); si no, se prefija con API_BASE.
 * - AbortController impone REQUEST_TIMEOUT_MS para no colgar la UI.
 * - Un !res.ok lanza SpotifyApiError; la UI usa el 401 para reautenticar.
 */
async function spotifyFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!res.ok) {
      let message = `Spotify API error ${res.status}`
      try {
        const body = (await res.json()) as {
          error?: { message?: string; status?: number }
        }
        if (body?.error?.message) {
          message = `[${res.status}] ${body.error.message}`
        }
      } catch {
        // cuerpo no-JSON: nos quedamos con el mensaje por defecto
      }
      throw new SpotifyApiError(res.status, message)
    }

    return (await res.json()) as T
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new SpotifyApiError(408, "La petición a Spotify expiró (timeout)")
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

/** Serializa opciones de paginación como URLSearchParams (sin '?' ni '&'). */
function pageParams(opts: PageOptions): URLSearchParams {
  const params = new URLSearchParams()
  if (opts.limit != null) params.set("limit", String(opts.limit))
  if (opts.offset != null) params.set("offset", String(opts.offset))
  return params
}

// ---------------------------------------------------------------------------
// Funciones públicas
// ---------------------------------------------------------------------------

export interface PageOptions {
  limit?: number
  offset?: number
}

/**
 * Perfil del usuario actual. Endpoint: GET /me
 * En dev mode solo trae id, display_name e images (ver tipo SpotifyUser).
 */
export async function getMe(accessToken: string): Promise<SpotifyUser> {
  const res = await spotifyFetch<RawUser>(accessToken, "/me")
  return mapUser(res)
}

/**
 * Busca tracks. Endpoint: GET /search?type=track&q=...&limit=&offset=
 */
export async function searchTracks(
  accessToken: string,
  query: string,
  opts: PageOptions = {},
): Promise<Paginated<SpotifyTrack>> {
  const params = new URLSearchParams()
  params.set("q", query)
  params.set("type", "track")
  if (opts.limit != null) params.set("limit", String(opts.limit))
  if (opts.offset != null) params.set("offset", String(opts.offset))
  const res = await spotifyFetch<{ tracks: RawPaginated<RawTrack> }>(
    accessToken,
    `/search?${params.toString()}`,
  )
  return mapPage(res.tracks, mapTrack)
}

/**
 * "Tus me gusta". Endpoint: GET /me/tracks?limit=&offset=
 * Requiere scope user-library-read. Cada item viene como { track }.
 */
export async function getSavedTracks(
  accessToken: string,
  opts: PageOptions = {},
): Promise<Paginated<SpotifyTrack>> {
  const res = await spotifyFetch<RawPaginated<RawSavedTrackItem>>(
    accessToken,
    `/me/tracks?${pageParams(opts).toString()}`,
  )
  return mapPage(res, (item) => mapTrack(item.track))
}

/**
 * Playlists del usuario. Endpoint: GET /me/playlists?limit=&offset=
 * Requiere scope playlist-read-private.
 */
export async function getMyPlaylists(
  accessToken: string,
  opts: PageOptions = {},
): Promise<Paginated<SpotifyPlaylist>> {
  const res = await spotifyFetch<RawPaginated<RawPlaylist>>(
    accessToken,
    `/me/playlists?${pageParams(opts).toString()}`,
  )
  return mapPage(res, mapPlaylist)
}

/**
 * Detalle de una playlist. Endpoint: GET /playlists/{id}
 */
export async function getPlaylist(
  accessToken: string,
  playlistId: string,
): Promise<SpotifyPlaylist> {
  const res = await spotifyFetch<RawPlaylist>(
    accessToken,
    `/playlists/${encodeURIComponent(playlistId)}`,
  )
  return mapPlaylist(res)
}

/**
 * Tracks de una playlist. Endpoint: GET /playlists/{id}/items?limit=&offset=
 * (renombrado de /tracks en feb 2026).
 *
 * IMPORTANTE (dev mode): las canciones solo se devuelven para playlists que el
 * usuario POSEE o COLABORA. Para playlists ajenas/de Spotify, `items` viene
 * ausente → devolvemos una página vacía (la UI muestra un aviso claro).
 *
 * Cada item trae el track en `item` (antes `track`); puede ser null.
 */
export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
  opts: PageOptions = {},
): Promise<Paginated<SpotifyTrack>> {
  const res = await spotifyFetch<Partial<RawPaginated<RawPlaylistTrackItem>>>(
    accessToken,
    `/playlists/${encodeURIComponent(playlistId)}/items?${pageParams(opts).toString()}`,
  )

  // Playlist ajena/de Spotify: no hay contenido accesible → página vacía.
  if (!Array.isArray(res.items)) {
    return { items: [], total: 0, limit: opts.limit ?? 0, offset: opts.offset ?? 0, next: null }
  }

  // Filtramos los items sin track ANTES de mapear.
  const validItems = res.items
    .filter((it): it is { item: RawTrack } => it.item != null)
    .map((it) => it.item)

  return mapPage<RawTrack, SpotifyTrack>(
    {
      items: validItems,
      total: res.total ?? validItems.length,
      limit: res.limit ?? validItems.length,
      offset: res.offset ?? 0,
      next: res.next ?? null,
    },
    mapTrack,
  )
}

// Exponemos los mappers y el schema por si quieres testearlos por separado.
export { mapTrack, mapPlaylist, mapUser, mapImage, mapPage }
export type { RawAlbum, RawPlaylistTrackItem, RawSavedTrackItem }
