"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useArtist, useArtistAlbums } from "../../../lib/hooks/spotify"
import { useAlbumColor } from "../../../lib/hooks/use-album-color"
import { ColorHero } from "../../../components/ColorHero"
import { AlbumCard } from "../../../components/artist/AlbumCard"
import { Button } from "../../../components/ui/Button"

/**
 * Página de artista (/artist/[id]): HERO inmersivo (foto difuminada de fondo +
 * color extraído + nombre grande) y grid de álbumes debajo.
 *
 * Vistoso pero ligero: solo CSS (gradientes, blur estático), reutiliza el
 * extractor de color y publica --album-color para el tinte de ambiente global.
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

  // Imagen PEQUEÑA (la misma que muestran las tarjetas/zigzag): al estar ya
  // descargada, el color se extrae al instante (sin hueco). El hero no muestra
  // foto grande, solo un acento circular pequeño, así que basta la pequeña.
  const hero = artist?.images.at(-1)?.url ?? artist?.images[0]?.url

  // Color de la foto del artista → tiñe el ambiente de la app mientras estás
  // en su página. Al salir, se limpia.
  const artistColor = useAlbumColor(hero)
  useEffect(() => {
    const root = document.documentElement
    if (artistColor) root.style.setProperty("--album-color", artistColor)
    return () => {
      // No borramos al salir para que el reproductor conserve su color si suena;
      // el player re-publica su propio color al cambiar de canción.
    }
  }, [artistColor])

  const albums = albumsData?.pages.flatMap((p) => p.items) ?? []

  return (
    <main className="no-scrollbar fade-right h-full w-full overflow-y-auto">
      <ColorHero
        title={loadingArtist ? "…" : (artist?.name ?? "Artista")}
        imageUrl={hero}
        shape="circle"
      />

      {/* ───────── Álbumes ───────── */}
      <div className="px-8 pb-10">
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
      </div>
    </main>
  )
}
