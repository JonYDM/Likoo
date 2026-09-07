"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import type { SpotifyArtist } from "@spotify-clone/shared"
import { spotifyKeys } from "./spotify"

/**
 * Abre la página de un artista SIN el "hueco" de carga.
 *
 * Como la tarjeta ya tiene el objeto completo del artista (nombre + imágenes),
 * lo sembramos en la cache de React Query (setQueryData) ANTES de navegar. Así,
 * cuando la página /artist/[id] monta, useArtist encuentra los datos ya en
 * cache → el hero y el color se pintan al instante, sin esperar el fetch.
 */
export function useOpenArtist() {
  const router = useRouter()
  const qc = useQueryClient()

  return useCallback(
    (artist: SpotifyArtist) => {
      qc.setQueryData(spotifyKeys.artist(artist.id), artist)
      router.push(`/artist/${artist.id}`)
    },
    [router, qc],
  )
}
