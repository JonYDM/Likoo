import Image from "next/image"
import type { SpotifyArtist } from "@spotify-clone/shared"

export interface ArtistCardProps {
  artist: SpotifyArtist
  onClick?: () => void
}

/**
 * Tarjeta de artista: foto CIRCULAR + nombre, centrado. Para carruseles y
 * grids (Home, estado vacío de Search). Ancho fijo para alinear en carrusel.
 */
export function ArtistCard({ artist, onClick }: ArtistCardProps) {
  const img = artist.images[0]?.url

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-36 shrink-0 flex-col items-center gap-2 rounded-2xl p-3 text-center outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring"
    >
      {img ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-full shadow-md">
          <Image src={img} alt="" fill sizes="144px" className="object-cover" />
        </div>
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-full bg-surface-hover text-2xl font-bold text-muted">
          {artist.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="w-full truncate text-sm font-medium text-foreground">
        {artist.name}
      </div>
    </button>
  )
}
