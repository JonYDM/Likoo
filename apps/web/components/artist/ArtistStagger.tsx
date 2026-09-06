"use client"

import type { SpotifyArtist } from "@spotify-clone/shared"

export interface ArtistStaggerProps {
  artists: SpotifyArtist[]
  onSelect?: (artist: SpotifyArtist) => void
}

/**
 * Artistas en "escalera": fotos pequeñas y circulares en una fila horizontal
 * que alternan su posición vertical (una arriba, la siguiente abajo, en
 * zigzag). Scroll horizontal. Pensado para el estado vacío de la búsqueda.
 */
export function ArtistStagger({ artists, onSelect }: ArtistStaggerProps) {
  return (
    <div className="no-scrollbar fade-x flex items-center gap-4 overflow-x-auto py-6">
      {artists.map((artist, i) => {
        const img = artist.images[0]?.url
        // Zigzag: los pares bajan, los impares suben (o al revés).
        const offset = i % 2 === 0 ? "translate-y-4" : "-translate-y-4"
        return (
          <button
            key={artist.id}
            type="button"
            onClick={() => onSelect?.(artist)}
            title={artist.name}
            className={`group shrink-0 outline-none transition-transform ${offset}`}
          >
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt=""
                loading="lazy"
                className="h-16 w-16 rounded-full object-cover shadow-md transition-transform group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-ring"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-hover text-lg font-bold text-muted">
                {artist.name.charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
