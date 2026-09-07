"use client"

import type { GameState } from "@spotify-clone/shared"
import { Button } from "../ui/Button"

/** Pantalla final: puntaje, aciertos y mejor racha, con opción de rejugar. */
export function GameResult({
  state,
  onPlayAgain,
  onChangeGenre,
}: {
  state: GameState
  onPlayAgain: () => void
  onChangeGenre: () => void
}) {
  const total = state.rounds.length

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-8 px-6 py-16 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-muted">
          Fin del reto
        </p>
        <h1 className="mt-2 text-6xl font-black tracking-tight text-foreground">
          {state.score}
        </h1>
        <p className="mt-1 text-muted">puntos</p>
      </div>

      <div className="grid w-full grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border p-5">
          <p className="text-3xl font-bold text-foreground">
            {state.correct}
            <span className="text-lg text-muted">/{total}</span>
          </p>
          <p className="mt-1 text-sm text-muted">aciertos</p>
        </div>
        <div className="rounded-2xl border border-border p-5">
          <p className="text-3xl font-bold text-foreground">{state.bestStreak}</p>
          <p className="mt-1 text-sm text-muted">mejor racha</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button intent="primary" size="lg" onClick={onPlayAgain}>
          Jugar otra vez
        </Button>
        <Button intent="secondary" size="lg" onClick={onChangeGenre}>
          Cambiar género
        </Button>
      </div>
    </div>
  )
}
