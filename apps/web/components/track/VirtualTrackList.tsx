"use client"

import { useVirtualizer } from "@tanstack/react-virtual"
import type { RefObject } from "react"
import type { SpotifyTrack } from "@spotify-clone/shared"
import { TrackRow } from "./TrackRow"

export interface VirtualTrackListProps {
  tracks: SpotifyTrack[]
  /** Contenedor con scroll que envuelve la lista (el <main> de la página). */
  scrollRef: RefObject<HTMLElement | null>
  onPlay?: (track: SpotifyTrack) => void
}

/** Altura estimada de cada fila (TrackRow: p-2 + 40px de thumb ≈ 56px). */
const ROW_HEIGHT = 56

/**
 * Lista de tracks VIRTUALIZADA: solo renderiza en el DOM las filas visibles
 * (más un pequeño overscan), aunque el array tenga cientos/miles de items.
 * Reduce drásticamente nodos DOM, memoria y repaint en listas largas.
 *
 * Requiere un `scrollRef` al contenedor que hace scroll (la página).
 */
export function VirtualTrackList({
  tracks,
  scrollRef,
  onPlay,
}: VirtualTrackListProps) {
  const virtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8, // filas extra arriba/abajo para scroll suave
  })

  return (
    <div
      style={{ height: virtualizer.getTotalSize(), position: "relative" }}
    >
      {virtualizer.getVirtualItems().map((row) => {
        const track = tracks[row.index]!
        return (
          <div
            key={track.id}
            data-index={row.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${row.start}px)`,
            }}
          >
            <TrackRow track={track} onClick={() => onPlay?.(track)} />
          </div>
        )
      })}
    </div>
  )
}
