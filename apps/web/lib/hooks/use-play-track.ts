"use client"

import { playTracks } from "@spotify-clone/shared"
import { useAuth } from "../auth-context"
import { usePlayerStore } from "../player-store"

/**
 * Hook para reproducir un track en el dispositivo web (Web Playback SDK).
 *
 * Combina el accessToken (AuthContext) + el deviceId (store del player) y llama
 * a playTracks. Devuelve una función `(trackUri) => Promise<void>` lista para
 * usar en onClick de TrackRow/TrackCard.
 *
 * Requiere Premium; si el dispositivo aún no está listo (sin deviceId) o no hay
 * token, no hace nada.
 */
export function usePlayTrack() {
  const { accessToken } = useAuth()
  const deviceId = usePlayerStore((s) => s.deviceId)

  return async (trackUri: string) => {
    if (!accessToken || !deviceId) return
    await playTracks(accessToken, deviceId, [trackUri])
  }
}
