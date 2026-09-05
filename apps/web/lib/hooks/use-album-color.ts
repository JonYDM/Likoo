"use client"

import { useEffect, useState } from "react"
import { Vibrant } from "node-vibrant/browser"

/**
 * Extrae el color dominante (vibrant) de una imagen (carátula) usando
 * node-vibrant. Se recalcula solo cuando cambia la URL → una vez por canción.
 *
 * Devuelve un color hex o null (si no hay imagen, falla CORS, o error).
 *
 * NOTA de rendimiento: node-vibrant descarga la imagen y procesa píxeles. Para
 * medir su impacto real usamos la carátula tal cual; si pesa demasiado en
 * dispositivos flojos, se reemplaza por un algoritmo casero más ligero.
 */
export function useAlbumColor(imageUrl: string | undefined): string | null {
  const [color, setColor] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function extract() {
      if (!imageUrl) {
        if (!cancelled) setColor(null)
        return
      }
      try {
        const palette = await Vibrant.from(imageUrl).getPalette()
        if (cancelled) return
        const swatch =
          palette.Vibrant ??
          palette.LightVibrant ??
          palette.Muted ??
          palette.DarkVibrant
        setColor(swatch?.hex ?? null)
      } catch {
        if (!cancelled) setColor(null)
      }
    }

    extract()

    return () => {
      cancelled = true
    }
  }, [imageUrl])

  return color
}
