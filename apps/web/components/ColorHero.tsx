/**
 * Hero reutilizable (artista, álbum, ...): imagen como acento (círculo o
 * cuadrado) + título y subtítulo.
 *
 * NO tiene fondo de color propio: el color lo aporta el tinte global del
 * AppShell (var(--album-color)), que cubre toda la app. Así hay UNA sola
 * fuente de color coherente — la misma que usa el reproductor al sonar una
 * canción. El hero es transparente y deja ver ese tinte.
 */
export interface ColorHeroProps {
  title: string
  subtitle?: string
  imageUrl?: string
  shape?: "circle" | "square"
}

export function ColorHero({
  title,
  subtitle,
  imageUrl,
  shape = "circle",
}: ColorHeroProps) {
  const rounded = shape === "circle" ? "rounded-full" : "rounded-lg"

  return (
    <header className="mb-8 flex h-56 items-end px-8 pb-6">
      <div className="flex items-center gap-5">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            crossOrigin="anonymous"
            className={`h-24 w-24 shrink-0 object-cover shadow-lg ring-2 ring-white/20 ${rounded}`}
          />
        ) : (
          <div className={`h-24 w-24 shrink-0 bg-surface-hover ${rounded}`} />
        )}
        <div className="min-w-0">
          <div className="mb-2 h-1 w-10 rounded-full bg-primary" />
          <h1 className="truncate text-4xl font-black tracking-tight text-foreground drop-shadow">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
    </header>
  )
}
