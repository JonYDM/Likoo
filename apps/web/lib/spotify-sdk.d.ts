// Tipos del Web Playback SDK que usamos.
interface Window {
  onSpotifyWebPlaybackSDKReady: () => void
  Spotify: {
    Player: new (options: {
      name: string
      getOAuthToken: (cb: (token: string) => void) => void
      volume?: number
    }) => Spotify.Player
  }
}

declare namespace Spotify {
  interface Artist {
    name: string
    uri: string
  }

  interface Album {
    name: string
    uri: string
    images: { url: string }[]
  }

  interface Track {
    id: string
    name: string
    uri: string
    artists: Artist[]
    album: Album
  }

  interface PlaybackState {
    paused: boolean
    position: number
    duration: number
    track_window: {
      current_track: Track
    }
  }

  interface ReadyEvent {
    device_id: string
  }

  interface Player {
    connect(): Promise<boolean>
    disconnect(): void
    addListener(event: "ready", cb: (e: ReadyEvent) => void): boolean
    addListener(event: "not_ready", cb: (e: ReadyEvent) => void): boolean
    addListener(
      event: "account_error",
      cb: (e: { message: string }) => void,
    ): boolean
    addListener(
      event: "player_state_changed",
      cb: (state: PlaybackState | null) => void,
    ): boolean
    removeListener(event: string): boolean
    togglePlay(): Promise<void>
    pause(): Promise<void>
    resume(): Promise<void>
    seek(ms: number): Promise<void>
    nextTrack(): Promise<void>
    previousTrack(): Promise<void>
    setVolume(volume: number): Promise<void>
  }
}
