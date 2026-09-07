import {create} from "zustand"

interface PlayerState {
     // Estado del dispositivo/SDK
    deviceId: string | null       // id del dispositivo web una vez "ready"
    isReady: boolean              // el SDK está listo
    isPremiumRequired: boolean    // true si dio account_error (no-Premium)

    // Estado de reproducción
    currentTrack: {
      id: string
      name: string
      artists: string
      albumArt?: string
    } | null
    isPaused: boolean
    positionMs: number
    durationMs: number

    // Acciones (setters que llamará el provider del SDK)
    setDeviceId: (id: string | null) => void
    setReady: (ready: boolean) => void
    setPremiumRequired: (v: boolean) => void
    setPlaybackState: (state: Partial<PlayerState>) => void

    // Instancia del SDK player (la guarda el PlayerProvider) y control de UI.
    player: Spotify.Player | null
    setPlayer: (player: Spotify.Player | null) => void
    togglePlay: () => void
    nextTrack: () => void
    previousTrack: () => void
    seek: (ms: number) => void

    // UI: reproductor expandido/comprimido (útil en móvil).
    isExpanded: boolean
    toggleExpanded: () => void

    // UI: oculta título/carátula del reproductor (para el Reto: no spoilear la
    // canción que hay que adivinar). Lo activa/desactiva la página /challenge.
    hideTrackInfo: boolean
    setHideTrackInfo: (v: boolean) => void
}

 export const usePlayerStore = create<PlayerState>((set, get) => ({
    deviceId: null,
    isReady: false,
    isPremiumRequired: false,
    currentTrack: null,
    isPaused: true,
    positionMs: 0,
    durationMs: 0,
    player: null,
    isExpanded: false,

    setDeviceId: (deviceId) => set({ deviceId }),
    setReady: (isReady) => set({ isReady }),
    setPremiumRequired: (isPremiumRequired) => set({ isPremiumRequired }),
    setPlaybackState: (state) => set(state),
    setPlayer: (player) => set({ player }),
    // Llama a togglePlay del SDK si el player existe. El evento
    // player_state_changed actualizará isPaused automáticamente.
    togglePlay: () => {
      get().player?.togglePlay()
    },
    nextTrack: () => {
      get().player?.nextTrack()
    },
    previousTrack: () => {
      get().player?.previousTrack()
    },
    seek: (ms) => {
      get().player?.seek(ms)
    },
    toggleExpanded: () => set((s) => ({ isExpanded: !s.isExpanded })),
    hideTrackInfo: false,
    setHideTrackInfo: (hideTrackInfo) => set({ hideTrackInfo }),
  }))