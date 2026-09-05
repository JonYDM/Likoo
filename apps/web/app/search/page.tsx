"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useSearchTracks } from "../../lib/hooks/spotify"
import { TrackRow } from "../../components/track/TrackRow"
import { TrackListSkeleton } from "../../components/track/TrackRowSkeleton"
import { Button } from "../../components/ui/Button"
import { cn } from "../../lib/cn"
import { usePlayTrack } from "../../lib/hooks/use-play-track"

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
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-6",
        hasQuery ? "justify-start pt-10" : "justify-center pb-20",
      )}
    >
      {!hasQuery && (
        <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-foreground">
          ¿Qué quieres escuchar?
        </h1>
      )}

      {/* Input con spinner sutil a la derecha (feedback inmediato) */}
      <div className="relative w-full">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="¿Qué quieres escuchar?"
          aria-label="Buscar canciones"
          autoFocus
          className="w-full rounded-full border border-border bg-surface px-6 py-4 pr-14 text-lg text-foreground shadow-lg outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring"
        />
        {showSpinner && (
          <Loader2
            className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-muted"
            size={20}
            aria-hidden="true"
          />
        )}
      </div>

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
            <ul className="flex flex-col gap-1">
              {results.map((track, i) => (
                <li
                  key={track.id}
                  className="animate-rise"
                  // Stagger sutil: cada fila entra con un micro-retraso.
                  style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
                >
                  <TrackRow track={track} onClick={() => playTrack(track.uri)} />
                </li>
              ))}
            </ul>
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
