import Image from "next/image"
import type { SpotifyAlbum } from "@spotify-clone/shared"

export interface AlbumCardProps {
  album: SpotifyAlbum
  onClick?: () => void
}

/**
 * Tarjeta de álbum: portada cuadrada + nombre + año. Para la página de artista.
 */
export function AlbumCard({ album, onClick }: AlbumCardProps) {
  const cover = album.images[0]?.url
  const year = album.releaseDate?.slice(0, 4)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col gap-2 rounded-2xl p-3 text-left outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring"
    >
      {cover ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-lg shadow-md">
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 768px) 45vw, 220px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="aspect-square w-full rounded-lg bg-surface-hover" />
      )}
      <div className="truncate text-sm font-medium text-foreground">
        {album.name}
      </div>
      {year && <div className="text-xs text-muted">{year}</div>}
    </button>
  )
}
