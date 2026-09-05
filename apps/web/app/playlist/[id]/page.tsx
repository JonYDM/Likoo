"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { usePlaylist, usePlaylistTracks } from "../../../lib/hooks/spotify"
import { TrackRow } from "../../../components/track/TrackRow"
import { TrackListSkeleton } from "../../../components/track/TrackRowSkeleton"
import { Button } from "../../../components/ui/Button"
import { FilterInput } from "../../../components/ui/FilterInput"
import { useAutoLoadAll } from "../../../lib/hooks/useAutoLoadAll"
import { usePlayTrack } from "../../../lib/hooks/use-play-track"

/**
 * Detalle de una playlist (Fase 2).
 *
 * Nota (dev mode): Spotify solo devuelve las canciones de playlists que el
 * usuario POSEE o COLABORA. Para playlists ajenas/de Spotify, la lista vendrá
 * vacía → mostramos un aviso claro en vez de una lista en blanco.
 */
export default function PlaylistPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const playTrack = usePlayTrack()

  const { data: playlist, isLoading: loadingPlaylist } = usePlaylist(id)
  const {
    data: tracksData,
    isLoading: loadingTracks,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePlaylistTracks(id)

  const tracks = useMemo(
    () => tracksData?.pages.flatMap((page) => page.items) ?? [],
    [tracksData],
  )
  const cover = playlist?.images[0]?.url

  // Filtro local de las canciones cargadas (por nombre o artista).
  const [filter, setFilter] = useState("")

  // Al filtrar, cargamos todas las páginas (hasta el tope) para buscar sobre
  // toda la playlist, no solo lo cargado.
  useAutoLoadAll({
    active: filter.trim().length > 0,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    pageCount: tracksData?.pages.length ?? 0,
    fetchNextPage,
  })
  const loadingAll = filter.trim().length > 0 && (hasNextPage || isFetchingNextPage)

  const filteredTracks = useMemo(() => {
    const q = filter.toLowerCase().trim()
    if (!q) return tracks
    return tracks.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.artists.some((a) => a.name.toLowerCase().includes(q)),
    )
  }, [tracks, filter])

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      {/* Cabecera: portada + nombre */}
      <header className="mb-8 flex items-center gap-5">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="h-28 w-28 shrink-0 rounded-lg object-cover shadow-lg"
          />
        ) : (
          <div className="h-28 w-28 shrink-0 rounded-lg bg-surface-hover" />
        )}
        <div className="min-w-0">
          <div className="h-1 w-10 rounded-full bg-primary" />
          <h1 className="mt-2 truncate text-3xl font-bold tracking-tight text-foreground">
            {loadingPlaylist ? "…" : (playlist?.name ?? "Playlist")}
          </h1>
          {playlist && (
            <p className="mt-1 text-sm text-muted">
              {playlist.owner.displayName
                ? `De ${playlist.owner.displayName}`
                : ""}
              {playlist.trackCount > 0 && ` · ${playlist.trackCount} canciones`}
            </p>
          )}
        </div>
      </header>

      {/* Lista de canciones */}
      {loadingTracks ? (
        <TrackListSkeleton count={8} />
      ) : isError ? (
        <p role="alert" className="text-muted">
          No se pudieron cargar las canciones.
        </p>
      ) : tracks.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <p className="text-foreground">
            No se pueden mostrar las canciones de esta playlist.
          </p>
          <p className="mt-2 text-sm text-muted">
            En modo desarrollo, Spotify solo permite ver el contenido de las
            playlists que tú creaste o en las que colaboras.
          </p>
        </div>
      ) : (
        <>
          {/* Filtro local de las canciones cargadas */}
          <div className="mb-4">
            <FilterInput
              value={filter}
              onChange={setFilter}
              placeholder="Filtrar en esta playlist..."
              aria-label="Filtrar canciones de la playlist"
              className="max-w-xs"
            />
          </div>

          {filteredTracks.length === 0 ? (
            <p className="text-muted">
              {loadingAll
                ? "Cargando toda la playlist para filtrar…"
                : `Ninguna de las canciones coincide con “${filter}”.`}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {filteredTracks.map((track, i) => (
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

          {hasNextPage && !filter && (
            <div className="mt-6 flex justify-center">
              <Button
                intent="secondary"
                size="md"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Cargando..." : "Cargar más"}
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
