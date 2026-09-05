"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "../lib/auth-context"
import { useMe, useSavedTracks } from "../lib/hooks/spotify"
import { Button } from "../components/ui/Button"
import { TrackRow } from "../components/track/TrackRow"
import { usePlayTrack } from "../lib/hooks/use-play-track"

export default function Home() {
  const { accessToken, isLoading } = useAuth()
  const router = useRouter()
  const playTrack = usePlayTrack()

  const { data: me } = useMe()
  const { data: savedData } = useSavedTracks()

  if (isLoading) {
    return (
      <main className="flex min-h-[60dvh] items-center justify-center">
        <p className="text-muted">Cargando...</p>
      </main>
    )
  }

  if (!accessToken) {
    return (
      <main className="flex min-h-[60dvh] items-center justify-center">
        <p className="text-muted">No autenticado</p>
      </main>
    )
  }

  const savedTracks = (savedData?.pages[0]?.items ?? []).slice(0, 5)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col justify-center px-6 py-10">
      {/* Saludo */}
      <header className="mb-8 space-y-2">
        <div className="h-1 w-12 rounded-full bg-primary" />
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {me?.displayName ? `Hola, ${me.displayName}` : "Bienvenido"}
        </h1>
        <p className="text-muted">¿Qué quieres escuchar hoy?</p>
      </header>

      {/* Tus me gusta (preview) */}
      {savedTracks.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Tus me gusta
            </h2>
            <Button
              intent="ghost"
              size="sm"
              onClick={() => router.push("/library")}
            >
              Ver todo
            </Button>
          </div>
          <ul className="flex flex-col gap-1">
            {savedTracks.map((track) => (
              <li key={track.id}>
                <TrackRow track={track} onClick={() => playTrack(track.uri)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
