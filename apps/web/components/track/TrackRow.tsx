import { forwardRef } from "react"
import type { SpotifyTrack } from "@spotify-clone/shared"
import { cn } from "../../lib/cn"

export interface TrackRowProps
    extends React.HTMLAttributes<HTMLButtonElement> {
    track: SpotifyTrack
  }

  export const TrackRow = forwardRef<HTMLButtonElement, TrackRowProps>(
    ({ track, className, ...props }, ref) => {
      // Elige la imagen MÁS PEQUEÑA para el thumbnail (cuidado del peso).
      // Spotify ordena las imágenes de mayor a menor, así que la última es la menor.
      const thumb = track.album.images.at(-1)?.url

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
          {thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              width={40}
              height={40}
              loading="lazy"
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
      )
    },
  )
  TrackRow.displayName = "TrackRow"