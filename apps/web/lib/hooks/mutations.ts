"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  addTracksToPlaylist,
  createPlaylist,
  saveToLibrary,
  removeFromLibrary,
} from "@spotify-clone/shared"
import { useAuth } from "../auth-context"
import { spotifyKeys } from "./spotify"

/**
 * Hooks de MUTACIÓN (escritura). Cada uno invalida la cache relevante al
 * terminar, para que las listas se refresquen automáticamente.
 */

/** Crear una playlist. Al terminar, refresca la lista de playlists. */
export function useCreatePlaylist() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      name: string
      description?: string
      isPublic?: boolean
    }) => createPlaylist(accessToken!, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: spotifyKeys.myPlaylists() })
    },
  })
}

/** Añadir tracks a una playlist. Refresca los tracks de esa playlist. */
export function useAddTracksToPlaylist() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (vars: { playlistId: string; trackUris: string[] }) =>
      addTracksToPlaylist(accessToken!, vars.playlistId, vars.trackUris),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: spotifyKeys.playlistTracks(vars.playlistId),
      })
    },
  })
}

/** Guardar tracks en "me gusta". Refresca la lista de saved tracks. */
export function useSaveToLibrary() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (uris: string[]) => saveToLibrary(accessToken!, uris),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: spotifyKeys.savedTracks() })
    },
  })
}

/** Quitar tracks de "me gusta". Refresca la lista de saved tracks. */
export function useRemoveFromLibrary() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (uris: string[]) => removeFromLibrary(accessToken!, uris),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: spotifyKeys.savedTracks() })
    },
  })
}
