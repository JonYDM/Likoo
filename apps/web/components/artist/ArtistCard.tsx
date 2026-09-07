import type { SpotifyArtist } from "@spotify-clone/shared"

export interface ArtistCardProps {
  artist: SpotifyArtist
  onClick?: () => void
}

/**
 * Tarjeta de artista: foto CIRCULAR pequeña + nombre. Usa <img> con la imagen
 * más pequeña (misma que el hero de /artist), para compartir cache del
 * navegador y que el color se extraiga al instante al entrar al artista.
 */
export function ArtistCard({ artist, onClick }: ArtistCardProps) {
  const img = artist.images.at(-1)?.url ?? artist.images[0]?.url

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-36 shrink-0 flex-col items-center gap-2 rounded-2xl p-3 text-center outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring"
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt=""
          loading="lazy"
          crossOrigin="anonymous"
          className="aspect-square w-full rounded-full object-cover shadow-md"
        />
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
