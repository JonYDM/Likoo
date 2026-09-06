"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMyPlaylists, useSavedTracks } from "../../lib/hooks/spotify"
import { PlaylistRow } from "../../components/playlist/PlaylistRow"
import { TrackCard } from "../../components/track/TrackCard"
import { Button } from "../../components/ui/Button"
import { FilterInput } from "../../components/ui/FilterInput"
import { useAutoLoadAll } from "../../lib/hooks/useAutoLoadAll"
import { usePlayTrack } from "../../lib/hooks/use-play-track"

/**
 * Librería (Fase 2): punto central del contenido del usuario.
 *  - Tus me gusta: carrusel horizontal de TrackCard, con filtro local.
 *  - Tus playlists: filas de PlaylistRow, con filtro local.
 *
 * Los filtros son LOCALES: filtran en memoria lo ya cargado (sin llamar a la
 * API). Rápido y sin peticiones; para contenido no cargado, "Cargar más".
 */

export default function LibraryPage() {
  const router = useRouter()
  const playTrack = usePlayTrack()

  const carouselRef = useRef<HTMLDivElement>(null)
  function scrollCarousel(direction: "left" | "right") {
    const el = carouselRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  // Estados de los filtros locales.
  const [savedFilter, setSavedFilter] = useState("")
  const [playlistFilter, setPlaylistFilter] = useState("")

  const {
    data: playlistsData,
    isLoading: loadingPlaylists,
    fetchNextPage: fetchMorePlaylists,
    hasNextPage: hasMorePlaylists,
    isFetchingNextPage: fetchingMorePlaylists,
  } = useMyPlaylists()

  const {
    data: savedData,
    isLoading: loadingSaved,
    isError: savedError,
    fetchNextPage: fetchMoreSaved,
    hasNextPage: hasMoreSaved,
    isFetchingNextPage: fetchingMoreSaved,
  } = useSavedTracks()

  const playlists = useMemo(
    () => playlistsData?.pages.flatMap((p) => p.items) ?? [],
    [playlistsData],
  )
  const savedTracks = useMemo(
    () => savedData?.pages.flatMap((p) => p.items) ?? [],
    [savedData],
  )
  const savedTotal = savedData?.pages[0]?.total ?? 0

  // Al filtrar, cargamos todas las páginas (hasta el tope) para poder buscar
  // sobre TODO el contenido, no solo lo ya cargado.
  useAutoLoadAll({
    active: savedFilter.trim().length > 0,
    hasNextPage: !!hasMoreSaved,
    isFetchingNextPage: fetchingMoreSaved,
    pageCount: savedData?.pages.length ?? 0,
    fetchNextPage: fetchMoreSaved,
  })
  useAutoLoadAll({
    active: playlistFilter.trim().length > 0,
    hasNextPage: !!hasMorePlaylists,
    isFetchingNextPage: fetchingMorePlaylists,
    pageCount: playlistsData?.pages.length ?? 0,
    fetchNextPage: fetchMorePlaylists,
  })

  // ¿Estamos cargando el resto por un filtro activo?
  const savedLoadingAll = savedFilter.trim().length > 0 && (hasMoreSaved || fetchingMoreSaved)
  const playlistLoadingAll =
    playlistFilter.trim().length > 0 && (hasMorePlaylists || fetchingMorePlaylists)

  // Filtrado local (memoizado). Compara nombre (y artista en tracks) sin
  // distinguir mayúsculas/acentos básicos.
  const norm = (s: string) => s.toLowerCase().trim()

  const filteredSaved = useMemo(() => {
    const q = norm(savedFilter)
    if (!q) return savedTracks
    return savedTracks.filter(
      (t) =>
        norm(t.name).includes(q) ||
        t.artists.some((a) => norm(a.name).includes(q)),
    )
  }, [savedTracks, savedFilter])

  const filteredPlaylists = useMemo(() => {
    const q = norm(playlistFilter)
    if (!q) return playlists
    return playlists.filter((p) => norm(p.name).includes(q))
  }, [playlists, playlistFilter])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden px-6 pt-10">
      <header className="mb-8 shrink-0 space-y-2">
        <div className="h-1 w-12 rounded-full bg-primary" />
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Tu librería
        </h1>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-8 pb-10">
        {/* Tus me gusta — carrusel horizontal (alto natural) */}
        <section className="shrink-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              Tus me gusta
              {savedTotal > 0 && (
                <span className="ml-2 text-sm font-normal text-muted">
                  {savedTotal} canciones
                </span>
              )}
            </h2>

            <div className="flex items-center gap-2">
              {savedTracks.length > 0 && (
                <FilterInput
                  value={savedFilter}
                  onChange={setSavedFilter}
                  placeholder="Filtrar me gusta..."
                  aria-label="Filtrar tus me gusta"
                  className="w-44"
                />
              )}
              {/* Controles del carrusel: solo desktop */}
              {filteredSaved.length > 0 && (
                <div className="hidden gap-2 md:flex">
                  <button
                    type="button"
                    aria-label="Anterior"
                    onClick={() => scrollCarousel("left")}
                    className="flex items-center justify-center rounded-full border border-border p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label="Siguiente"
                    onClick={() => scrollCarousel("right")}
                    className="flex items-center justify-center rounded-full border border-border p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {loadingSaved ? (
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 w-40 shrink-0 animate-pulse rounded-lg bg-surface-hover"
                />
              ))}
            </div>
          ) : savedError ? (
            <p role="alert" className="text-muted">
              No se pudieron cargar tus me gusta.
            </p>
          ) : savedTracks.length === 0 ? (
            <p className="text-muted">Aún no tienes canciones guardadas.</p>
          ) : filteredSaved.length === 0 ? (
            <p className="text-muted">
              {savedLoadingAll
                ? "Cargando todas tus canciones para filtrar…"
                : `Ninguna de las canciones coincide con “${savedFilter}”.`}
            </p>
          ) : (
            <div
              ref={carouselRef}
              className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-2"
              style={{
                maskImage:
                  "linear-gradient(to right, black calc(100% - 4rem), transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to right, black calc(100% - 4rem), transparent 100%)",
              }}
            >
              {filteredSaved.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onClick={() => playTrack(track.uri)}
                />
              ))}

              {/* Mientras carga el resto por el filtro, tarjeta indicadora */}
              {savedLoadingAll && (
                <div className="flex w-40 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
                  Cargando…
                </div>
              )}

              {/* Cargar más manual solo sin filtro */}
              {hasMoreSaved && !savedFilter && (
                <button
                  type="button"
                  onClick={() => fetchMoreSaved()}
                  disabled={fetchingMoreSaved}
                  className="flex w-40 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted outline-none transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {fetchingMoreSaved ? "Cargando..." : "Cargar más"}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Tus playlists — panel contenido (card con fondo, sombra, redondeo) */}
        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-surface/60 p-5 shadow-lg">
          <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              Tus playlists
            </h2>
            {playlists.length > 0 && (
              <FilterInput
                value={playlistFilter}
                onChange={setPlaylistFilter}
                placeholder="Filtrar playlists..."
                aria-label="Filtrar tus playlists"
                className="w-44"
              />
            )}
          </div>

          {loadingPlaylists ? (
            <div className="flex flex-col gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2"
                  aria-hidden="true"
                >
                  <div className="h-12 w-12 shrink-0 animate-pulse rounded bg-surface-hover" />
                  <div className="flex flex-col gap-2">
                    <div className="h-3 w-40 animate-pulse rounded bg-surface-hover" />
                    <div className="h-2.5 w-24 animate-pulse rounded bg-surface-hover" />
                  </div>
                </div>
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <p className="text-muted">No tienes playlists.</p>
          ) : filteredPlaylists.length === 0 ? (
            <p className="text-muted">
              {playlistLoadingAll
                ? "Cargando todas tus playlists para filtrar…"
                : `Ninguna playlist coincide con “${playlistFilter}”.`}
            </p>
          ) : (
            // Caja con scroll interno: la lista scrollea aquí dentro, no la
            // página. Scrollbar visible (azul) para indicar que hay más.
            <div className="scroll-visible min-h-0 flex-1 overflow-y-auto pr-2">
              <ul className="flex flex-col gap-1">
                {filteredPlaylists.map((playlist) => (
                  <li key={playlist.id}>
                    <PlaylistRow
                      playlist={playlist}
                      onClick={() => router.push(`/playlist/${playlist.id}`)}
                    />
                  </li>
                ))}
              </ul>
              {hasMorePlaylists && !playlistFilter && (
                <div className="mt-4 flex justify-center">
                  <Button
                    intent="secondary"
                    size="sm"
                    onClick={() => fetchMorePlaylists()}
                    disabled={fetchingMorePlaylists}
                  >
                    {fetchingMorePlaylists ? "Cargando..." : "Ver más playlists"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/*
            Difuminado inferior del PANEL (con el color del anillo de focus).
            Vive a nivel de la <section> (no dentro del scroll), así queda fijo
            sobre el borde inferior del panel mientras la lista scrollea detrás.
          */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 rounded-b-3xl"
            style={{
              background:
                "linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-ring) 25%, transparent))",
            }}
          />
        </section>
      </div>
    </div>
  )
}
