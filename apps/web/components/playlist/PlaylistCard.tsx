 import type { SpotifyPlaylist } from "@spotify-clone/shared"
  import { Card } from "../ui/Card"

  export interface PlaylistCardProps {
    playlist: SpotifyPlaylist
    onClick?: () => void
  }

// Imagen de portada: la primera (mayor) o undefined si no hay

export function PlaylistCard ({playlist, onClick}: PlaylistCardProps){
    const cover = playlist.images[0]?.url

    return(
        <Card
        interactive
        padding="sm"
        onClick={onClick}
        className="flex flex-col gap-2"
        > {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="aspect-square w-full rounded object-cover"
          />
        ) : (
          <div className="aspect-square w-full rounded bg-surface-hover" />
        )}
        <div className="truncate text-sm font-medium text-foreground">
          {playlist.name}
        </div>
        <div className="truncate text-xs text-muted">
          {playlist.trackCount} canciones
        </div>
      </Card>
    )
}