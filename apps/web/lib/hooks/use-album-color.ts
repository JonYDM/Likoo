"use client"

import { useEffect, useState } from "react"

/**
 * Extrae un color dominante de una imagen SIN dependencias externas.
 *
 * Cómo (ligero): carga la imagen (crossOrigin para poder leer píxeles), la
 * dibuja MUY pequeña (16x16) en un <canvas> off-screen, y promedia los píxeles
 * ignorando los casi-transparentes y muy oscuros/claros extremos. Trabajar a
 * 16x16 = 256 píxeles hace el cálculo trivial (microsegundos), a diferencia de
 * procesar la imagen a tamaño real.
 *
 * Reemplaza a node-vibrant (que traía ~60 subdependencias). Menos preciso que
 * Vibrant, pero suficiente para un tinte de fondo.
 *
 * Devuelve "rgb(r, g, b)" o null. Se recalcula solo al cambiar la URL.
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
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = imageUrl
        await img.decode()
        if (cancelled) return

        const SIZE = 16
        const canvas = document.createElement("canvas")
        canvas.width = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        ctx.drawImage(img, 0, 0, SIZE, SIZE)
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE)

        let r = 0
        let g = 0
        let b = 0
        let count = 0
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3]!
          if (alpha < 125) continue // ignora casi-transparentes
          const pr = data[i]!
          const pg = data[i + 1]!
          const pb = data[i + 2]!
          // Ignora casi-blanco y casi-negro (no aportan "color").
          const max = Math.max(pr, pg, pb)
          const min = Math.min(pr, pg, pb)
          if (max > 245 && min > 245) continue
          if (max < 12) continue
          r += pr
          g += pg
          b += pb
          count++
        }

        if (cancelled) return
        if (count === 0) {
          setColor(null)
          return
        }
        setColor(
          `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(
            b / count,
          )})`,
        )
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
