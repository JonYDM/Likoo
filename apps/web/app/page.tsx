"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../lib/auth-context"
import {
  useMe,
  useRecentlyPlayed,
  useTopArtists,
  useTopTracks,
} from "../lib/hooks/spotify"
import { usePlayTrack } from "../lib/hooks/use-play-track"
import { getGreeting } from "../lib/greeting"
import { TrackCard } from "../components/track/TrackCard"
import { ArtistCard } from "../components/artist/ArtistCard"
import { Carousel } from "../components/ui/Carousel"
import { CreatePlaylistButton } from "../components/playlist/CreatePlaylistButton"
import { useOpenArtist } from "../lib/hooks/use-open-artist"
import type { SpotifyTrack } from "@spotify-clone/shared"

export default function Home() {
  const { accessToken, isLoading } = useAuth()
  const playTrack = usePlayTrack()
  const openArtist = useOpenArtist()

  const { data: me } = useMe()
  const { data: recent } = useRecentlyPlayed(15)
  const { data: topArtists } = useTopArtists(12)
  const { data: topTracks } = useTopTracks(12)

  // Saludo por hora, calculado en cliente (evita hydration mismatch).
  const [greeting, setGreeting] = useState<string | null>(null)
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setGreeting(getGreeting({ name: me?.displayName })),
    )
    return () => cancelAnimationFrame(id)
  }, [me?.displayName])

  if (isLoading) {
    return (
      <main className="flex h-full items-center justify-center">
        <p className="text-muted">Cargando...</p>
      </main>
    )
  }

  if (!accessToken) {
    return (
      <main className="flex h-full items-center justify-center">
        <p className="text-muted">No autenticado</p>
      </main>
    )
  }

  const trackCard = (track: SpotifyTrack) => (
    <TrackCard
      key={track.id}
      track={track}
      onClick={() => playTrack(track.uri)}
    />
  )

  return (
    <main className="no-scrollbar fade-right h-full w-full overflow-y-auto px-6 py-10">
      {/* Saludo + acción de crear (enfrente, a la derecha) */}
      <header className="mb-8 flex items-center justify-between gap-4 pr-4 sm:pr-8">
        <div className="space-y-2">
          <div className="h-1 w-12 rounded-full bg-primary" />
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {greeting ??
              (me?.displayName ? `Hola, ${me.displayName}` : "Bienvenido")}
          </h1>
          <p className="text-muted">Esto es lo que has estado escuchando.</p>
        </div>
        <CreatePlaylistButton />
      </header>

      <div className="flex flex-col gap-10">
        {/* Escuchado recientemente */}
        {recent && recent.length > 0 && (
          <Carousel title="Escuchado recientemente">
            {recent.map(trackCard)}
          </Carousel>
        )}

        {/* Tus top artistas */}
        {topArtists && topArtists.length > 0 && (
          <Carousel title="Tus artistas del momento">
            {topArtists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onClick={() => openArtist(artist)}
              />
            ))}
          </Carousel>
        )}

        {/* Tus top canciones */}
        {topTracks && topTracks.length > 0 && (
          <Carousel title="Tus canciones favoritas">
            {topTracks.map(trackCard)}
          </Carousel>
        )}
      </div>
    </main>
  )
}
