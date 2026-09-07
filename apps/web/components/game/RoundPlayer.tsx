"use client"

import type { Round } from "@spotify-clone/shared"
import { cn } from "../../lib/cn"

/**
 * Vista de una ronda (presentacional). El control de reproducción y el timer
 * viven en el padre; aquí solo pintamos: barra de tiempo, "?" mientras suena
 * (o la carátula al revelar) y los 4 botones de opción con su estado.
 */
export function RoundPlayer({
  round,
  roundNumber,
  totalRounds,
  msRemaining,
  msTotal,
  revealed,
  selectedTrackId,
  score,
  streak,
  onAnswer,
  onNext,
}: {
  round: Round
  roundNumber: number
  totalRounds: number
  msRemaining: number
  msTotal: number
  revealed: boolean
  selectedTrackId: string | null
  score: number
  streak: number
  onAnswer: (trackId: string) => void
  onNext: () => void
}) {
  const correctId = round.track.id
  const timePct = msTotal > 0 ? Math.max(0, (msRemaining / msTotal) * 100) : 0

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-6 py-10">
      {/* Cabecera: progreso de la partida + puntaje */}
      <div className="flex w-full items-center justify-between text-sm text-muted">
        <span>
          Ronda {roundNumber} / {totalRounds}
        </span>
        <span className="flex items-center gap-3">
          {streak > 1 && (
            <span className="font-semibold text-primary">🔥 {streak}</span>
          )}
          <span className="font-semibold text-foreground">{score} pts</span>
        </span>
      </div>

      {/* Portada oculta ("?") o revelada. Contenedor pequeño: la carátula mini
          de Spotify se ve nítida a este tamaño. */}
      <div className="relative h-32 w-32 overflow-hidden rounded-2xl bg-surface-hover shadow-xl">
        {revealed && round.track.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={round.track.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl font-black text-muted">
            ?
          </div>
        )}
      </div>

      {/* Título: espacio SIEMPRE reservado (misma altura) para que no salte al
          revelar. Mientras no se revela, barras skeleton; al revelar, el texto. */}
      <div className="flex h-14 flex-col items-center justify-center gap-2 text-center">
        {revealed ? (
          <>
            {selectedTrackId === "" && (
              <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
                Se acabó el tiempo
              </p>
            )}
            <p className="text-xl font-bold text-foreground">{round.track.title}</p>
            <p className="text-muted">{round.track.artist}</p>
          </>
        ) : (
          <>
            <div className="h-5 w-48 animate-pulse rounded-full bg-surface-hover" />
            <div className="h-4 w-32 animate-pulse rounded-full bg-surface-hover" />
          </>
        )}
      </div>

      {/* Barra de tiempo (solo mientras se juega) */}
      {!revealed && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${timePct}%` }}
          />
        </div>
      )}

      {/* Opciones */}
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {round.options.map((opt) => {
          const isCorrect = opt.trackId === correctId
          const isPicked = opt.trackId === selectedTrackId
          return (
            <button
              key={opt.trackId}
              type="button"
              disabled={revealed}
              onClick={() => onAnswer(opt.trackId)}
              className={cn(
                "rounded-xl border px-5 py-4 text-left font-semibold outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
                revealed && isCorrect && "border-green-500 bg-green-500/15 text-foreground",
                revealed && isPicked && !isCorrect && "border-red-500 bg-red-500/15 text-foreground",
                revealed && !isCorrect && !isPicked && "border-border text-muted opacity-60",
                !revealed && "border-border text-foreground hover:border-primary hover:bg-surface-hover",
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Continuar (tras revelar) */}
      {revealed && (
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {roundNumber >= totalRounds ? "Ver resultado" : "Siguiente"}
        </button>
      )}
    </div>
  )
}
