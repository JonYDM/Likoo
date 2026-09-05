import { forwardRef } from "react"
import type { SpotifyPlaylist } from "@spotify-clone/shared"
import { cn } from "../../lib/cn"

export interface PlaylistRowProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  playlist: SpotifyPlaylist
}

/**
 * Fila horizontal de playlist (formato rectangular, como TrackRow):
 * carátula pequeña + nombre + dueño/conteo. Clickable (button) para ir al
 * detalle. Usa solo tokens semánticos.
 */
export const PlaylistRow = forwardRef<HTMLButtonElement, PlaylistRowProps>(
  ({ playlist, className, ...props }, ref) => {
    const thumb = playlist.images.at(-1)?.url ?? playlist.images[0]?.url

    return (
      <button
        ref={ref}
        className={cn(
          "flex w-full items-center gap-3 rounded-md p-2 text-left",
          "transition-colors hover:bg-surface-hover",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        {...props}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            width={48}
            height={48}
            loading="lazy"
            className="h-12 w-12 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="h-12 w-12 shrink-0 rounded bg-surface-hover" />
        )}
        <div className="min-w-0">
          <div className="truncate text-foreground">{playlist.name}</div>
          <div className="truncate text-sm text-muted">
            {playlist.trackCount > 0
              ? `${playlist.trackCount} canciones`
              : "Playlist"}
          </div>
        </div>
      </button>
    )
  },
)
PlaylistRow.displayName = "PlaylistRow"
