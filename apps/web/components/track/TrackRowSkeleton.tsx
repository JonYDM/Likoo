/**
 * Skeleton de una fila de track: placeholder gris pulsante con la misma forma
 * que TrackRow. Se muestra mientras cargan los resultados para evitar el
 * "parpadeo" (contenido que aparece de golpe) → sensación de continuidad.
 */
export function TrackRowSkeleton() {
  return (
    <div className="flex w-full items-center gap-3 p-2" aria-hidden="true">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded bg-surface-hover" />
      <div className="flex min-w-0 flex-col gap-2">
        <div className="h-3 w-40 animate-pulse rounded bg-surface-hover" />
        <div className="h-2.5 w-24 animate-pulse rounded bg-surface-hover" />
      </div>
    </div>
  )
}

/** Renderiza N skeletons (para llenar la lista mientras carga). */
export function TrackListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <TrackRowSkeleton key={i} />
      ))}
    </div>
  )
}
