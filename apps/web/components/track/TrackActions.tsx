"use client"

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { MoreHorizontal, Heart, ListPlus } from "lucide-react"
import type { SpotifyTrack } from "@spotify-clone/shared"
import { useMyPlaylists } from "../../lib/hooks/spotify"
import {
  useSaveToLibrary,
  useAddTracksToPlaylist,
} from "../../lib/hooks/mutations"

/**
 * Menú de acciones de un track (Radix DropdownMenu):
 *  - Guardar en "Me gusta".
 *  - Añadir a una de tus playlists (submenú con la lista).
 *
 * Radix maneja apertura/cierre/teclado/posicionamiento; estilos con Tailwind.
 */
export function TrackActions({ track }: { track: SpotifyTrack }) {
  const saveToLibrary = useSaveToLibrary()
  const addToPlaylist = useAddTracksToPlaylist()
  const { data: playlistsData } = useMyPlaylists()

  const playlists = playlistsData?.pages.flatMap((p) => p.items) ?? []

  const itemClass =
    "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-colors data-[highlighted]:bg-surface-hover"

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Más opciones"
          onClick={(e) => e.stopPropagation()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted outline-none transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreHorizontal size={18} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-52 rounded-xl border border-border bg-surface p-1 shadow-xl outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu.Item
            className={itemClass}
            onSelect={() => saveToLibrary.mutate([track.uri])}
          >
            <Heart size={16} />
            Guardar en Me gusta
          </DropdownMenu.Item>

          {playlists.length > 0 && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger className={itemClass}>
                  <ListPlus size={16} />
                  Añadir a playlist
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent
                    sideOffset={4}
                    className="z-50 max-h-64 min-w-52 overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-xl outline-none"
                  >
                    {playlists.map((pl) => (
                      <DropdownMenu.Item
                        key={pl.id}
                        className={itemClass}
                        onSelect={() =>
                          addToPlaylist.mutate({
                            playlistId: pl.id,
                            trackUris: [track.uri],
                          })
                        }
                      >
                        <span className="truncate">{pl.name}</span>
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
