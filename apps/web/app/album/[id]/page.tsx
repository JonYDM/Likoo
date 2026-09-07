"use client"

import { useParams } from "next/navigation"
import { useAlbum, useAlbumTracks } from "../../../lib/hooks/spotify"
import { usePlayTrack } from "../../../lib/hooks/use-play-track"
import { ColorHero } from "../../../components/ColorHero"
import { TrackRow } from "../../../components/track/TrackRow"
import { TrackListSkeleton } from "../../../components/track/TrackRowSkeleton"

/**
 * Página de álbum (/album/[id]): hero de color + lista de canciones.
 *
 * NO extrae su propio color: reutiliza --album-color (ya puesto por el artista
 * del que vienes, o por el reproductor). Un proceso menos, y color coherente.
 */
export default function AlbumPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const playTrack = usePlayTrack()

  const { data: album, isLoading: loadingAlbum } = useAlbum(id)
  const { data: tracks, isLoading: loadingTracks } = useAlbumTracks(id, album)

  const cover = album?.images[0]?.url
  const year = album?.releaseDate?.slice(0, 4)

  return (
    <main className="no-scrollbar fade-right h-full w-full overflow-y-auto">
      <ColorHero
        title={loadingAlbum ? "…" : (album?.name ?? "Álbum")}
        subtitle={
          album
            ? `${year ? `${year} · ` : ""}${album.totalTracks} canciones`
            : undefined
        }
        imageUrl={cover}
        shape="square"
      />

      {/* Canciones */}
      <div className="px-8 pb-10">
        {loadingTracks || loadingAlbum ? (
          <TrackListSkeleton count={8} />
        ) : !tracks || tracks.length === 0 ? (
          <p className="text-muted">No se encontraron canciones.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {tracks.map((track, i) => (
              <li
                key={`${track.id}-${i}`}
                className="animate-rise"
                style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
              >
                <TrackRow track={track} onClick={() => playTrack(track.uri)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
