"use client"

import { useEffect, useState } from "react"

/**
 * Extrae una PALETA de colores dominantes de una imagen, sin dependencias.
 *
 * Cómo (ligero): dibuja la imagen a 24x24 en un canvas, cuantiza cada píxel a
 * "buckets" (redondea cada canal a pasos de 32) y cuenta frecuencias. Devuelve
 * los `count` colores más frecuentes (ignorando casi-transparentes y
 * blancos/negros extremos). Trabajar a 24x24 = 576 píxeles → cálculo trivial.
 *
 * Se recalcula solo al cambiar la URL. Devuelve array de "rgb(...)".
 */
export function useAlbumPalette(
  imageUrl: string | undefined,
  count = 3,
): string[] {
  const [palette, setPalette] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false

    async function extract() {
      if (!imageUrl) {
        if (!cancelled) setPalette([])
        return
      }
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = imageUrl
        await img.decode()
        if (cancelled) return

        const SIZE = 24
        const canvas = document.createElement("canvas")
        canvas.width = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(img, 0, 0, SIZE, SIZE)
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE)

        // Cuenta frecuencia de colores cuantizados (buckets de 32).
        const buckets = new Map<string, { r: number; g: number; b: number; n: number }>()
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3]!
          if (a < 125) continue
          const r = data[i]!
          const g = data[i + 1]!
          const b = data[i + 2]!
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          if (max > 245 && min > 245) continue // casi blanco
          if (max < 12) continue // casi negro
          const key = `${r >> 5}-${g >> 5}-${b >> 5}`
          const cur = buckets.get(key)
          if (cur) {
            cur.r += r
            cur.g += g
            cur.b += b
            cur.n++
          } else {
            buckets.set(key, { r, g, b, n: 1 })
          }
        }

        if (cancelled) return

        const sorted = [...buckets.values()]
          .sort((a, b) => b.n - a.n)
          .slice(0, count)
          .map(
            (c) =>
              `rgb(${Math.round(c.r / c.n)}, ${Math.round(
                c.g / c.n,
              )}, ${Math.round(c.b / c.n)})`,
          )

        setPalette(sorted)
      } catch {
        if (!cancelled) setPalette([])
      }
    }

    extract()
    return () => {
      cancelled = true
    }
  }, [imageUrl, count])

  return palette
}
