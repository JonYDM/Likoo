"use client"

import { useParams, useRouter } from "next/navigation"
import { useArtist, useArtistAlbums } from "../../../lib/hooks/spotify"
import { AlbumCard } from "../../../components/artist/AlbumCard"
import { Button } from "../../../components/ui/Button"

/**
 * Página de artista (/artist/[id]): foto grande + nombre + sus álbumes en grid.
 * Datos vía useArtist (GET /artists/{id}) y useArtistAlbums
 * (GET /artists/{id}/albums), ambos disponibles en dev mode.
 */
export default function ArtistPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()

  const { data: artist, isLoading: loadingArtist } = useArtist(id)
  const {
    data: albumsData,
    isLoading: loadingAlbums,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useArtistAlbums(id)

  const albums = albumsData?.pages.flatMap((p) => p.items) ?? []
  const hero = artist?.images[0]?.url

  return (
    <main className="no-scrollbar fade-right h-full w-full overflow-y-auto px-6 py-10">
      {/* Cabecera del artista */}
      <header className="mb-10 flex items-center gap-6">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero}
            alt=""
            className="h-32 w-32 shrink-0 rounded-full object-cover shadow-lg"
          />
        ) : (
          <div className="h-32 w-32 shrink-0 rounded-full bg-surface-hover" />
        )}
        <div className="min-w-0">
          <div className="h-1 w-10 rounded-full bg-primary" />
          <h1 className="mt-2 truncate text-4xl font-bold tracking-tight text-foreground">
            {loadingArtist ? "…" : (artist?.name ?? "Artista")}
          </h1>
        </div>
      </header>

      {/* Álbumes */}
      <h2 className="mb-4 text-lg font-semibold text-foreground">Álbumes</h2>

      {loadingAlbums ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-surface-hover"
            />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <p className="text-muted">No se encontraron álbumes.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {albums.map((album, i) => (
              <div
                key={`${album.id}-${i}`}
                className="animate-rise"
                style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
              >
                <AlbumCard
                  album={album}
                  onClick={() => router.push(`/album/${album.id}`)}
                />
              </div>
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Button
                intent="secondary"
                size="md"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Cargando..." : "Ver más álbumes"}
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
