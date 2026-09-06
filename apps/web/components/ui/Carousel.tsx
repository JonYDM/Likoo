"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface CarouselProps {
  /** Título de la sección (se muestra arriba, con los controles al lado). */
  title?: string
  children: React.ReactNode
}

/**
 * Carrusel horizontal reutilizable:
 *  - Scroll lateral (touch/trackpad en móvil; flechas ‹ › en desktop).
 *  - Fade en los bordes (mask CSS) para que los items no se vean "cortados"
 *    contra el layout — el contenido se desvanece suave en los extremos.
 *  - Flechas solo en desktop (lg+), en la cabecera junto al título.
 *
 * Los hijos deben ser items con ancho fijo (w-*) y `shrink-0`.
 */
export function Carousel({ title, children }: CarouselProps) {
  const ref = useRef<HTMLDivElement>(null)

  function scrollBy(dir: "left" | "right") {
    const el = ref.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  return (
    <section>
      {(title || true) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? (
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          ) : (
            <span />
          )}
          {/* Controles: solo desktop (en móvil se usa swipe) */}
          <div className="hidden gap-2 lg:flex">
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => scrollBy("left")}
              className="flex items-center justify-center rounded-full border border-border p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              onClick={() => scrollBy("right")}
              className="flex items-center justify-center rounded-full border border-border p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Pista scrolleable con fade en el borde DERECHO. */}
      <div
        ref={ref}
        className="no-scrollbar fade-right flex gap-3 overflow-x-auto scroll-smooth pb-2"
      >
        {children}
      </div>
    </section>
  )
}
