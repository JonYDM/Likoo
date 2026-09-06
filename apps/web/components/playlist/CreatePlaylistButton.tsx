"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import * as Popover from "@radix-ui/react-popover"
import { Plus } from "lucide-react"
import { Button } from "../ui/Button"
import { useCreatePlaylist } from "../../lib/hooks/mutations"

/**
 * Botón "Componer" + POPOVER (Radix) para crear una playlist. El popover sale
 * del propio botón (posicionamiento y cierre accesibles los maneja Radix); los
 * estilos son nuestros (Tailwind + paleta). Al crear, navega a la playlist.
 */
export function CreatePlaylistButton() {
  const router = useRouter()
  const createPlaylist = useCreatePlaylist()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return
    const playlist = await createPlaylist.mutateAsync({
      name: trimmed,
      description: description.trim() || undefined,
      isPublic,
    })
    setOpen(false)
    setName("")
    setDescription("")
    setIsPublic(false)
    router.push(`/playlist/${playlist.id}`)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button intent="primary" size="md">
          <Plus size={18} />
          Componer
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-2xl border border-border bg-surface p-4 shadow-xl outline-none"
        >
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Nueva playlist
          </h2>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate()
            }}
            placeholder="Nombre"
            aria-label="Nombre de la playlist"
            autoFocus
            className="mb-2 w-full rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            aria-label="Descripción"
            rows={2}
            className="mb-3 w-full resize-none rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring"
          />

          {/* Toggle Pública/Privada */}
          <label className="mb-3 flex cursor-pointer items-center justify-between text-sm text-foreground">
            <span>Pública</span>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic((v) => !v)}
              className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${
                isPublic ? "bg-primary justify-end" : "bg-surface-hover justify-start"
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
            </button>
          </label>

          <div className="flex justify-end">
            <Button
              intent="primary"
              size="sm"
              onClick={handleCreate}
              disabled={!name.trim() || createPlaylist.isPending}
            >
              {createPlaylist.isPending ? "Creando..." : "Crear"}
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
