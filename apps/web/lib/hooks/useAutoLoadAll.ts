"use client"

import { useEffect } from "react"

/** Tope de seguridad: nº máximo de páginas a auto-cargar al filtrar. */
const MAX_PAGES = 40 // p.ej. 40 * 50 = 2000 items máx (me gusta / playlists)

interface AutoLoadArgs {
  /** Se activa la carga automática solo cuando esto es true (p.ej. hay filtro). */
  active: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  pageCount: number
  fetchNextPage: () => void
}

/**
 * Carga automáticamente las páginas siguientes (una a una, secuencial) mientras
 * `active` sea true y queden páginas, hasta MAX_PAGES.
 *
 * Uso: para que un filtro local pueda buscar sobre TODO el contenido y no solo
 * la primera página. Secuencial (no en paralelo) para no saturar el rate limit
 * de Spotify en dev mode. El tope evita cargar listas gigantes en dispositivos
 * con pocos recursos.
 */
export function useAutoLoadAll({
  active,
  hasNextPage,
  isFetchingNextPage,
  pageCount,
  fetchNextPage,
}: AutoLoadArgs) {
  useEffect(() => {
    if (!active) return
    if (!hasNextPage) return
    if (isFetchingNextPage) return
    if (pageCount >= MAX_PAGES) return
    fetchNextPage()
  }, [active, hasNextPage, isFetchingNextPage, pageCount, fetchNextPage])
}

export { MAX_PAGES }
