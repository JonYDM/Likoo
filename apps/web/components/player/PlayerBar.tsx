"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Music,
  Search,
} from "lucide-react"
import { usePlayerStore } from "../../lib/player-store"
import { cn } from "../../lib/cn"
import { useAlbumColor } from "../../lib/hooks/use-album-color"
import { useAlbumPalette } from "../../lib/hooks/use-album-palette"

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
  // Paleta (3 colores) para las "luces" flotantes del lienzo.
  const palette = useAlbumPalette(currentTrack?.albumArt, 3)

  // Publicamos el color como variable CSS global (--album-color) en :root. Así
  // cualquier componente (player, perfil...) lo usa vía var(--album-color) en
  // CSS puro: sin estado React compartido, sin re-renders, el navegador repinta
  // solo lo que la usa. Es lo más eficiente y desacoplado.
  useEffect(() => {
    const root = document.documentElement
    if (albumColor) {
      root.style.setProperty("--album-color", albumColor)
    } else {
      root.style.removeProperty("--album-color")
    }
  }, [albumColor])

  // Aviso no-Premium (ocupa la columna en desktop, flota en móvil).
  if (isPremiumRequired) {
    return (
      <aside className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted shadow-lg lg:static lg:bottom-auto lg:left-auto lg:flex lg:h-dvh lg:translate-x-0 lg:items-center lg:justify-center lg:rounded-none lg:border-0 lg:bg-transparent lg:px-6 lg:text-center">
        Necesitas Spotify Premium para reproducir.
      </aside>
    )
  }

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

  const cover = currentTrack?.albumArt

  return (
    <>
      {/* ───────── DESKTOP (lg+): lienzo en su columna del grid ─────────
        El <aside> ocupa su columna, alto completo (sticky). Dentro, una card
        que "flota": despegada de los bordes (margen), redondeada, con sombra.
        Contiene el efecto de color de la carátula. Siempre presente (aunque no
        haya canción) para no colapsar la columna. */}
      <aside className="sticky top-0 hidden h-dvh p-4 lg:block">
        <div
          className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-border/50 bg-surface/40 p-6 shadow-lg backdrop-blur-sm"
          style={
            // Estado vacío: usa el mismo azul del difuminado de playlists.
            !currentTrack
              ? {
                  background:
                    "linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-ring) 25%, transparent))",
                }
              : undefined
          }
        >
          {/* Luces de color: blobs con la PALETA de la canción, flotando lento
              (solo transform → GPU). El fondo del lienzo son los colores de la
              rola, no la carátula. Detrás del contenido (z-0). */}
          {palette.length > 0 && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
            >
              <div
                className="animate-blob-a absolute left-[10%] top-[15%] h-2/3 w-2/3 rounded-full blur-3xl"
                style={{ background: palette[0], opacity: 0.5 }}
              />
              {palette[1] && (
                <div
                  className="animate-blob-b absolute right-[5%] top-[30%] h-2/3 w-2/3 rounded-full blur-3xl"
                  style={{ background: palette[1], opacity: 0.45 }}
                />
              )}
              {palette[2] && (
                <div
                  className="animate-blob-c absolute bottom-[10%] left-[20%] h-2/3 w-2/3 rounded-full blur-3xl"
                  style={{ background: palette[2], opacity: 0.4 }}
                />
              )}
            </div>
          )}

          {currentTrack ? (
            <div className="relative z-10 flex w-full max-w-xs flex-col gap-4">
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
          ) : (
            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-hover text-muted">
                <Music size={28} />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Nada suena ahora
                </p>
                <p className="mt-1 text-sm text-muted">
                  Elige una canción para volver a darle play.
                </p>
              </div>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                <Search size={16} />
                Buscar música
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ───────── MÓVIL / MEDIANO: píldora flotante (solo si hay canción) ───────── */}
      {currentTrack && (
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
      )}
    </>
  )
}
