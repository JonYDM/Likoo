import Image from "next/image"
import type { SpotifyTrack } from "@spotify-clone/shared"

export interface TrackCardProps {
  track: SpotifyTrack
  onClick?: () => void
}

/**
 * Tarjeta vertical de canción (para carruseles horizontales): carátula
 * cuadrada + título + artista. Ancho fijo para alinearse en el carrusel.
 */
export function TrackCard({ track, onClick }: TrackCardProps) {
  const cover = track.album.images[0]?.url

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-40 shrink-0 flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-left outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring"
    >
      {cover ? (
        <div className="relative aspect-square w-full overflow-hidden rounded">
          <Image
            src={cover}
            alt=""
            fill
            sizes="160px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="aspect-square w-full rounded bg-surface-hover" />
      )}
      <div className="truncate text-sm font-medium text-foreground">
        {track.name}
      </div>
      <div className="truncate text-xs text-muted">
        {track.artists.map((a) => a.name).join(", ")}
      </div>
    </button>
  )
}
