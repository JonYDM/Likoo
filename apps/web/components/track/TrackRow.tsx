import { memo } from "react"
import Image from "next/image"
import type { SpotifyTrack } from "@spotify-clone/shared"
import { cn } from "../../lib/cn"
import { TrackActions } from "./TrackActions"

export interface TrackRowProps {
  track: SpotifyTrack
  /** Acción al hacer clic en la fila (normalmente reproducir). */
  onClick?: () => void
  className?: string
}

/**
 * Fila de track: área clickable (reproducir) + menú de acciones a la derecha.
 *
 * Es un <div> (no <button>) porque contiene DOS zonas interactivas: la fila que
 * reproduce y el menú de acciones (TrackActions). Anidar botones es HTML
 * inválido, por eso la zona de reproducir es un <button> interno y el menú va
 * aparte. El menú aparece al hover (o siempre en touch) para no saturar.
 */
export const TrackRow = memo(function TrackRow({
  track,
  onClick,
  className,
}: TrackRowProps) {
  const thumb = track.album.images.at(-1)?.url

  return (
    <div
      className={cn(
        "group flex w-full items-center gap-3 rounded-md p-2",
        "transition-colors hover:bg-surface-hover",
        className,
      )}
    >
      {/* Zona clickable: reproduce el track */}
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {thumb && (
          <Image
            src={thumb}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded object-cover"
          />
        )}
        <div className="min-w-0">
          <div className="truncate text-foreground">{track.name}</div>
          <div className="truncate text-sm text-muted">
            {track.artists.map((a) => a.name).join(", ")}
          </div>
        </div>
      </button>

      {/* Menú de acciones (me gusta, añadir a playlist) */}
      <TrackActions track={track} />
    </div>
  )
})
