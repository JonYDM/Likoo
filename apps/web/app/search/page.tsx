"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { useSearchTracks, useTopArtists } from "../../lib/hooks/spotify"
import { TrackListSkeleton } from "../../components/track/TrackRowSkeleton"
import { VirtualTrackList } from "../../components/track/VirtualTrackList"
import { ArtistStagger } from "../../components/artist/ArtistStagger"
import { Button } from "../../components/ui/Button"
import { cn } from "../../lib/cn"
import { usePlayTrack } from "../../lib/hooks/use-play-track"
import { useOpenArtist } from "../../lib/hooks/use-open-artist"
import { getGreeting } from "../../lib/greeting"

/**
 * Búsqueda (Fase 2) con experiencia premium y fluida:
 *  - Un único layout: el input no se desmonta (no salta, no pierde foco).
 *  - Vacío: input+título centrados. Con query: input arriba + resultados.
 *  - Skeletons mientras carga (sin parpadeo), spinner en el input (feedback
 *    inmediato) y entrada suave de resultados (animate-rise).
 */
export default function SearchPage() {
  const [input, setInput] = useState("")
  const [debounced, setDebounced] = useState("")
  const playTrack = usePlayTrack()
  const openArtist = useOpenArtist()
  const { data: topArtists } = useTopArtists(12)
  const scrollRef = useRef<HTMLElement | null>(null)

  // Frase gancho por hora (sin nombre), calculada en cliente.
  const [greeting, setGreeting] = useState<string | null>(null)
  useEffect(() => {
    const id = requestAnimationFrame(() => setGreeting(getGreeting()))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const id = setTimeout(() => setDebounced(input), 400)
    return () => clearTimeout(id)
  }, [input])

  const hasQuery = debounced.trim().length > 0
  // ¿El usuario ya escribió pero el debounce aún no "cuaja"? → feedback inmediato.
  const isTyping = input.trim() !== debounced.trim()

  const {
    data: searchData,
    isLoading: isSearching,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchTracks(debounced)

  const results = searchData?.pages.flatMap((page) => page.items) ?? []
  // Spinner en el input mientras se teclea o mientras la petición está en vuelo.
  const showSpinner = (isTyping || isSearching) && input.trim().length > 0

  return (
    <main
      ref={scrollRef}
      className={cn(
        "no-scrollbar mx-auto flex h-full w-full max-w-4xl flex-col overflow-y-auto px-6",
        hasQuery ? "justify-start pt-10" : "justify-center pb-20 pt-10",
      )}
    >
      {!hasQuery && (
        <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-foreground">
          {greeting ?? "¿Qué quieres escuchar?"}
        </h1>
      )}

      {/* Input con spinner sutil a la derecha (feedback inmediato) */}
      <div className="relative mx-auto w-[90%]">
        {/*
          Halo RGB: capa detrás del input con el color de la canción actual
          (var(--album-color)) + blur, que "respira" animando solo opacity
          (barato). Sobresale del input (inset negativo). Si no hay canción,
          cae al azul de marca (--color-ring).
        */}
        <div
          aria-hidden="true"
          className="animate-halo pointer-events-none absolute -inset-0.5 -z-10 rounded-full blur-md"
          style={{
            background: "var(--album-color, var(--color-ring))",
          }}
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="¿Qué quieres escuchar?"
          aria-label="Buscar canciones"
          autoFocus
          className="w-full rounded-full border border-border bg-surface px-6 py-4 pr-14 text-lg text-foreground shadow-lg outline-none transition-colors placeholder:text-muted"
        />
        {showSpinner && (
          <Loader2
            className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-muted"
            size={20}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Estado vacío: tus artistas del momento en "escalera" (zigzag) */}
      {!hasQuery && topArtists && topArtists.length > 0 && (
        <div className="mt-10">
          <ArtistStagger
            artists={topArtists}
            onSelect={(artist) => openArtist(artist)}
          />
        </div>
      )}

      {hasQuery && (
        <div className="mt-6">
          {/* Carga inicial: skeletons en vez de parpadeo */}
          {isSearching ? (
            <TrackListSkeleton count={6} />
          ) : isError ? (
            <p role="alert" className="text-muted">
              Error: {error?.message}
            </p>
          ) : results.length === 0 ? (
            <p className="text-muted">Sin resultados para “{debounced}”.</p>
          ) : (
            <VirtualTrackList
              tracks={results}
              scrollRef={scrollRef}
              onPlay={(track) => playTrack(track.uri)}
            />
          )}

          {hasNextPage && !isSearching && (
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
        </div>
      )}
    </main>
  )
}
