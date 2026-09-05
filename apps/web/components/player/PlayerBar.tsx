"use client"

import { useEffect, useState } from "react"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { usePlayerStore } from "../../lib/player-store"
import { cn } from "../../lib/cn"
import { useAlbumColor } from "../../lib/hooks/use-album-color"

/** Formatea milisegundos como m:ss. */
function fmt(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function PlayerBar() {
  const {
    currentTrack,
    isPaused,
    isPremiumRequired,
    positionMs,
    durationMs,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    isExpanded,
    toggleExpanded,
  } = usePlayerStore()

  // Progreso animado. Todo el cálculo temporal ocurre DENTRO del effect (no en
  // render): al (re)recibir positionMs, anclamos base+inicio en variables
  // locales del effect y un intervalo actualiza el estado `progress`. Nada de
  // Date.now() ni refs accedidos durante el render (reglas de React Compiler).
  const [progress, setProgress] = useState(positionMs)

  useEffect(() => {
    const base = positionMs
    const startedAt = Date.now()

    function update() {
      setProgress(
        isPaused ? base : Math.min(base + (Date.now() - startedAt), durationMs),
      )
    }

    // Primer update diferido (no síncrono en el cuerpo del effect) + intervalo.
    const raf = requestAnimationFrame(update)
    const id = isPaused ? undefined : setInterval(update, 1000)

    return () => {
      cancelAnimationFrame(raf)
      if (id) clearInterval(id)
    }
  }, [positionMs, isPaused, durationMs])

  // Color dominante de la carátula (para el efecto de fondo del lienzo).
  // Se llama antes de cualquier return condicional (reglas de hooks).
  const albumColor = useAlbumColor(currentTrack?.albumArt)

  // Aviso no-Premium.
  if (isPremiumRequired) {
    return (
      <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted shadow-lg lg:bottom-auto lg:right-6 lg:top-1/2 lg:left-auto lg:-translate-x-0 lg:-translate-y-1/2">
        Necesitas Spotify Premium para reproducir.
      </div>
    )
  }

  if (!currentTrack) return null

  const pct = durationMs > 0 ? (progress / durationMs) * 100 : 0

  // Barra de progreso interactiva (clic para hacer seek).
  const progressBar = (
    <div
      className="group h-1.5 w-full cursor-pointer rounded-full bg-surface-hover"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const ratio = (e.clientX - rect.left) / rect.width
        seek(Math.floor(ratio * durationMs))
      }}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  )

  const controls = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Anterior"
        onClick={previousTrack}
        className="text-muted transition-colors hover:text-foreground"
      >
        <SkipBack size={18} />
      </button>
      <button
        type="button"
        aria-label={isPaused ? "Reproducir" : "Pausar"}
        onClick={togglePlay}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        {isPaused ? <Play size={20} /> : <Pause size={20} />}
      </button>
      <button
        type="button"
        aria-label="Siguiente"
        onClick={nextTrack}
        className="text-muted transition-colors hover:text-foreground"
      >
        <SkipForward size={18} />
      </button>
    </div>
  )

  const cover = currentTrack.albumArt

  return (
    <>
      {/* ───────── DESKTOP (lg+): lienzo alto con el reproductor dentro ───────── */}
      {/*
        El <aside> es el "lienzo": panel alto (96dvh) a la derecha, con fondo
        translúcido. Aquí vivirá el efecto de color de la carátula (bounce).
        Dentro, la card del reproductor centrada verticalmente.
      */}
      <aside className="fixed right-6 top-1/2 z-30 hidden h-[96dvh] w-72 -translate-y-1/2 flex-col justify-center overflow-hidden rounded-3xl border border-border/50 bg-surface/30 p-5 backdrop-blur-sm lg:flex">
        {/*
          Capa de color: resplandor con el color dominante de la carátula, que
          sube desde abajo y transiciona suave al cambiar de canción. Detrás del
          contenido (z-0), contenida por el overflow-hidden del lienzo.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-0 transition-[background] duration-700 ease-out"
          style={{
            background: albumColor
              ? `radial-gradient(120% 80% at 50% 100%, ${albumColor}66 0%, transparent 70%)`
              : undefined,
          }}
        />
        <div className="relative z-10 flex flex-col gap-4">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="aspect-square w-full rounded-lg object-cover shadow-md"
            />
          )}
          <div className="min-w-0 text-center">
            <div className="truncate font-semibold text-foreground">
              {currentTrack.name}
            </div>
            <div className="truncate text-sm text-muted">
              {currentTrack.artists}
            </div>
          </div>
          <div className="space-y-1">
            {progressBar}
            <div className="flex justify-between text-xs text-muted">
              <span>{fmt(progress)}</span>
              <span>{fmt(durationMs)}</span>
            </div>
          </div>
          <div className="flex justify-center">{controls}</div>
        </div>
      </aside>

      {/* ───────── MÓVIL / MEDIANO: píldora flotante comprimible ───────── */}
      <div
        className={cn(
          "fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-2xl border border-border bg-surface shadow-lg lg:hidden",
          isExpanded ? "w-[min(92vw,26rem)] p-4" : "w-[min(92vw,22rem)] p-2",
        )}
      >
        <div className="flex items-center gap-3">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="h-12 w-12 shrink-0 rounded object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">
              {currentTrack.name}
            </div>
            <div className="truncate text-xs text-muted">
              {currentTrack.artists}
            </div>
          </div>
          {controls}
          <button
            type="button"
            aria-label={isExpanded ? "Comprimir" : "Expandir"}
            onClick={toggleExpanded}
            className="text-muted transition-colors hover:text-foreground"
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>

        {/* Expandido: barra de progreso + tiempos */}
        {isExpanded && (
          <div className="mt-3 space-y-1">
            {progressBar}
            <div className="flex justify-between text-xs text-muted">
              <span>{fmt(progress)}</span>
              <span>{fmt(durationMs)}</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
