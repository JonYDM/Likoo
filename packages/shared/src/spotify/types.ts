/**
 * Tipos de la Spotify Web API que consume la UI (Fase 2).
 *
 * Estrategia de rendimiento:
 *  - Exponemos tipos "delgados" (solo los campos que usa la UI) para no arrastrar
 *    el objeto gigante de Spotify por toda la app → menos memoria en dispositivos
 *    con pocos recursos.
 *  - El client mapea del shape crudo (snake_case, anidado) a estos tipos limpios
 *    con funciones simples de asignación de campos — coste O(1) por item, sin
 *    validación pesada por elemento.
 *  - La *estructura* de la respuesta (la envoltura paginada) sí se valida con zod
 *    una sola vez por página; los items NO se validan uno a uno.
 */

// ---------------------------------------------------------------------------
// Tipos limpios (los que ve la UI)
// ---------------------------------------------------------------------------

export interface SpotifyImage {
  url: string
  width: number | null
  height: number | null
}

/**
 * Perfil del usuario (GET /me). En Development Mode (cambios feb 2026) ya NO
 * se devuelven email, product, country, followers — solo lo básico. Por eso
 * este tipo se limita a lo que sigue disponible.
 */
export interface SpotifyUser {
  id: string
  displayName: string | null
  images: SpotifyImage[]
}

export interface SpotifyArtistRef {
  id: string
  name: string
}

/** Artista completo (con imágenes), para tarjetas y página de artista. */
export interface SpotifyArtist {
  id: string
  name: string
  uri: string
  images: SpotifyImage[]
}

/** Álbum (para la página de artista). */
export interface SpotifyAlbum {
  id: string
  name: string
  uri: string
  images: SpotifyImage[]
  releaseDate: string
  totalTracks: number
}

export interface SpotifyTrack {
  id: string
  name: string
  uri: string
  durationMs: number
  artists: SpotifyArtistRef[]
  album: {
    id: string
    name: string
    images: SpotifyImage[]
  }
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  images: SpotifyImage[]
  owner: { id: string; displayName: string }
  trackCount: number
}

/** Página de resultados (paginación offset-based de Spotify). */
export interface Paginated<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  /** URL completa de la siguiente página, o null si es la última. */
  next: string | null
}

// ---------------------------------------------------------------------------
// Shapes CRUDOS de la Web API (lo que devuelve Spotify, tal cual)
// Se usan solo dentro del client para mapear a los tipos limpios de arriba.
// ---------------------------------------------------------------------------

export interface RawImage {
  url: string
  width: number | null
  height: number | null
}

export interface RawArtist {
  id: string
  name: string
}

/** Artista completo (GET /artists/{id}, /me/top/artists, /me/following). */
export interface RawArtistFull {
  id: string
  name: string
  uri: string
  images: RawImage[]
}

/** Álbum completo (GET /artists/{id}/albums). */
export interface RawAlbumFull {
  id: string
  name: string
  uri: string
  images: RawImage[]
  release_date: string
  total_tracks: number
}

/** Item de "recently played": el track viene en `track`. */
export interface RawRecentlyPlayedItem {
  track: RawTrack
}

export interface RawAlbum {
  id: string
  name: string
  images: RawImage[]
}

export interface RawUser {
  id: string
  display_name: string | null
  images: RawImage[]
}

export interface RawTrack {
  id: string
  name: string
  uri: string
  duration_ms: number
  artists: RawArtist[]
  album: RawAlbum
}

export interface RawPlaylist {
  id: string
  name: string
  description: string | null
  images: RawImage[]
  owner: { id: string; display_name: string }
  // Conteo: `tracks.total` (endpoint clásico) o `items.total` (nuevo). Ambos
  // opcionales porque según permisos/endpoint pueden no venir.
  tracks?: { total: number }
  items?: { total: number }
}

/** Item de la lista de "saved tracks": el track viene envuelto en { track }. */
export interface RawSavedTrackItem {
  track: RawTrack
}

/**
 * Item de la lista de una playlist (endpoint /playlists/{id}/items, feb 2026).
 * El track ahora viene en `item` (antes era `track`). Puede ser null si el
 * track fue removido/no disponible.
 */
export interface RawPlaylistTrackItem {
  item: RawTrack | null
}

/** Envoltura paginada cruda de Spotify. */
export interface RawPaginated<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  next: string | null
}
