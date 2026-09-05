"use client"

import { Search } from "lucide-react"
import { cn } from "../../lib/cn"

export interface FilterInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string
  onChange: (value: string) => void
}

/**
 * Input de filtrado local (no llama a la API): filtra en memoria lo ya cargado.
 * Pequeño, con lupa, reutilizable en cualquier sección (playlists, me gusta,
 * tracks de una playlist).
 */
export function FilterInput({
  value,
  onChange,
  className,
  placeholder = "Filtrar...",
  ...props
}: FilterInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-border bg-surface py-2 pl-9 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring"
        {...props}
      />
    </div>
  )
}
