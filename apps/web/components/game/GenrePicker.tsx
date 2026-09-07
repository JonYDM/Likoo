"use client"

import { GENRES } from "@spotify-clone/shared"
import { cn } from "../../lib/cn"
import { Button } from "../ui/Button"

/**
 * Pantalla de setup del Reto: elige género y arranca. Puramente presentacional;
 * el estado (género elegido) vive en el padre.
 */
export function GenrePicker({
  selected,
  onSelect,
  onStart,
  disabled,
}: {
  selected: string | null
  onSelect: (genre: string) => void
  onStart: () => void
  disabled?: boolean
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-6 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Adivina la canción
        </h1>
        <p className="mt-2 text-muted">
          Elige un género, escucha un fragmento y adivina el título antes de que
          se acabe el tiempo.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {GENRES.map((g) => {
          const active = selected === g.query
          return (
            <button
              key={g.query}
              type="button"
              onClick={() => onSelect(g.query)}
              className={cn(
                "rounded-full border px-5 py-2 text-sm font-semibold outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted hover:border-primary/50 hover:text-foreground",
              )}
            >
              {g.label}
            </button>
          )
        })}
      </div>

      <Button
        intent="primary"
        size="lg"
        onClick={onStart}
        disabled={!selected || disabled}
      >
        {disabled ? "Preparando…" : "Jugar"}
      </Button>
    </div>
  )
}
