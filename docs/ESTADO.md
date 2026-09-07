# Estado del proyecto — Spotify Clone (Likoo)

> Documento de contexto para retomar rápido si se reinicia la sesión.
> Última actualización: sesión del 2026-09-06.

## Qué es

Clon de Spotify en JS/TS (monorepo pnpm), proyecto de aprendizaje. UI propia
(azul metálico), distinta a Spotify. Ruta: `C:\Users\jonyo\spotify-clone`.
Repo: `github.com/JonYDM/Likoo`. Identidad git local: JonYDM /
jonyocampo05@gmail.com.

## Stack

- Monorepo pnpm workspaces: `apps/web` (Next.js 16, App Router, Turbopack, React
  19, Tailwind v4), `apps/server` (Express/Socket.io, aún sin usar),
  `packages/shared` (cliente Spotify + tipos + juego, agnóstico de framework).
- TanStack Query (datos), Zustand (estado del player), cva + tailwind-merge
  (componentes), lucide-react (iconos), Radix (popover, dropdown-menu),
  @tanstack/react-virtual (listas).
- Node 24. Dev: `pnpm dev:web` → SIEMPRE en `http://127.0.0.1:3000` (NO
  localhost: rompe cookies OAuth).

## Restricciones Spotify Dev Mode (feb 2026) — MUY IMPORTANTE

- `/search` limit máx 10 (default 5). Usamos PAGE_SIZE=10.
- Playlists: contenido (`items`) solo de playlists PROPIAS o colaborativas.
  Endpoints renombrados `/tracks` → `/items`.
- `GET /me` ya NO trae product/email/country. Premium se detecta por el evento
  `account_error` del SDK, no por /me.product.
- Removidos: recommendations, browse, new-releases, related-artists,
  top-tracks de artista, /markets, batch fetches.
- Disponibles y usados: search, /me, /me/top/{artists,tracks},
  /me/player/recently-played, /me/tracks, /me/playlists, /playlists/{id}(+/items),
  /artists/{id}(+/albums), /albums/{id}(+/tracks), player (play/pause/etc),
  crear playlist (POST /me/playlists), PUT/DELETE /me/library.
- **Rate limit BAJO**: fácil llegar a 429 Too Many Requests con muchas pruebas.
  Es temporal, se libera esperando. NO es bug de código.
- App en Development Mode requiere que el dueño tenga Premium.

## Fases (del docs/PLAN.md)

- Fase 0 (tooling), 1 (auth PKCE), 2 (búsqueda/librería/UI), 3 (reproducción
  Web Playback SDK): COMPLETADAS.
- Fase 4 (motor juego local), 5 (multijugador socket.io), 6 (pulido+móvil):
  PENDIENTES.

## Lo hecho (estado actual)

### Auth (Fase 1) ✓
- PKCE en `apps/web/app/api/auth/*` (login, callback, exchange, token, logout).
- `lib/auth-context.tsx`: token en memoria, refresh 60s antes de expirar,
  refresh() y logout(). `proxy.ts` (antes middleware) protege rutas.
- Scopes actuales: streaming, user-read-email/private, user-library-read/modify,
  playlist-read-private, playlist-modify-private/public, user-top-read,
  user-read-recently-played. (Cambiar scopes = reautenticar.)

### Cliente Spotify (`packages/shared/src/spotify/`)
- `client.ts`: spotifyFetch (timeout, maneja 204, SpotifyApiError con status).
  Funciones: searchTracks, getSavedTracks, getMyPlaylists, getPlaylist,
  getPlaylistTracks, getMe, getTopArtists, getTopTracks, getRecentlyPlayed,
  getArtist, getArtistAlbums, getAlbum, getAlbumTracks, playTracks,
  createPlaylist, addTracksToPlaylist, saveToLibrary, removeFromLibrary.
- Mappers Raw→limpio (mapTrack/Playlist/User/Artist/Album). mapPage valida la
  envoltura paginada con zod (una vez por página, no por item).
- `types.ts`: tipos limpios + Raw.

### Hooks web (`apps/web/lib/hooks/`)
- `spotify.ts`: useMe, useSearchTracks, useSavedTracks, useMyPlaylists,
  usePlaylist, usePlaylistTracks, useTopArtists, useTopTracks,
  useRecentlyPlayed, useArtist, useArtistAlbums, useAlbum, useAlbumTracks.
  Helper genérico `useSpotifyInfinite`. spotifyKeys centralizadas.
- `mutations.ts`: useCreatePlaylist, useAddTracksToPlaylist, useSaveToLibrary,
  useRemoveFromLibrary (invalidan cache).
- `use-play-track.ts` (useCallback), `use-album-color.ts` (extractor casero
  canvas 16x16, sin node-vibrant), `use-album-palette.ts` (3 colores),
  `use-open-artist.ts` (siembra cache del artista antes de navegar → sin hueco),
  `useAutoLoadAll.ts` (carga todas las páginas al filtrar, tope 40).

### Reproducción (Fase 3) ✓
- `player-store.ts` (Zustand): deviceId, currentTrack, isPaused, position/duration,
  togglePlay/next/previous/seek, isExpanded, player instance.
- `player-provider.tsx`: carga Web Playback SDK, crea player UNA vez (dep
  `hasToken`, no accessToken → no se destruye en cada refresh), getOAuthToken
  vía tokenRef. FIX aplicado: antes se rompía al recargar.
- `PlayerBar.tsx`: desktop = lienzo en columna derecha con blobs de color de la
  paleta (flotan, solo transform, pausa al pausar); móvil = píldora flotante.
  Estado vacío: "Nada suena ahora" + botón buscar. Progreso con rAF.
- `spotify-sdk.d.ts`: tipos del SDK.

### UI / layout
- `AppShell.tsx`: en rutas auth → solo contenido; resto → grid 3 columnas
  (nav izq / contenido / player der). Incluye el TINTE GLOBAL de ambiente:
  capa fija con `var(--album-color)` al 12% radial → toda la app se tiñe del
  color de la canción/artista. ESTA es la única fuente de color de ambiente.
- Nav: `Nav.tsx` orquesta `BottomNav` (móvil, píldora iconos) y `SideNav`
  (desktop: perfil arriba con foto+nombre+logout, items centro, logo LIKOO
  brillante abajo con letras animadas).
- Componentes: ui/{Button,Card,FilterInput,Carousel}, track/{TrackRow(memo),
  TrackCard,TrackActions(dropdown me gusta/añadir a playlist),TrackRowSkeleton,
  VirtualTrackList}, playlist/{PlaylistRow,CreatePlaylistButton(popover con
  nombre+descripción+toggle público)}, artist/{ArtistCard,AlbumCard,
  ArtistStagger(zigzag)}, ColorHero (hero TRANSPARENTE compartido artista/álbum:
  imagen acento + título; el color lo pone el AppShell global).
- Paleta = design tokens en globals.css (steel/neutral + semánticos). Soporta
  claro/oscuro por prefers-color-scheme.
- Scroll: `html/body overflow hidden` (sin barra de sistema). Cada página con su
  scroll interno. `no-scrollbar` en casi todo; `scroll-visible` (azul) solo en
  "Tus playlists" de librería. Clase `fade-right` (mask borde derecho) en las
  páginas. `fade-x` (ambos lados) en el zigzag.
- Imágenes: next/image en cards de listas; `<img>` normal + crossOrigin en
  artistas (para compartir cache con el extractor de color).

### Vistas
- `/` Home: saludo por hora (lib/greeting.ts), botón "Componer" (crear playlist),
  carruseles: recientes, top artistas, top tracks.
- `/search`: input central 90% con halo de color (--album-color), saludo por
  hora, search-as-you-type (debounce 400), resultados virtualizados, estado
  vacío = zigzag de artistas.
- `/library`: playlists (filas, panel con difuminado azul inferior, scroll
  interno visible) + me gusta (carrusel). Filtros locales con carga bajo demanda.
- `/playlist/[id]`: portada + tracks virtualizados + filtro. Distingue playlist
  propia vacía vs sin acceso.
- `/artist/[id]`: ColorHero + grid de álbumes. Siembra color en --album-color.
- `/album/[id]`: ColorHero (hereda color) + tracks. NO extrae color propio
  (reutiliza --album-color) para ahorrar proceso.
- `/login`: full-bleed (fuera del grid), logo LIKOO brillante, resplandor azul.

## Decisiones de rendimiento (prioridad del usuario)

- Animaciones SOLO transform/opacity (GPU). Nada de animar background/blur/
  box-shadow/width.
- prefers-reduced-motion global desactiva animaciones.
- Virtualización de listas largas (react-virtual) en search y playlist.
- Extractor de color casero (canvas pequeño), sin node-vibrant.
- Color compartido vía CSS variable global `--album-color` (sin estado React,
  sin re-renders): lo publican el player y las páginas de artista.

## Peculiaridades del linter (React Compiler, muy estricto)

- Prohíbe setState síncrono en effect, Date.now()/refs en render, animar refs.
  Patrón usado para esquivarlo: cálculos en callbacks (rAF, setInterval).
- Warning conocido e inofensivo en VirtualTrackList (useVirtualizer no memoizable
  — intrínseco a react-virtual). 0 errores, 1 warning.

## Verificación

Comandos: `pnpm -r typecheck`, `pnpm -r lint`, `pnpm --filter web build`.
Estado: todo verde (typecheck, lint 0 errores + 1 warning conocido, build).

## Git / commits

- Convención: Conventional Commits, título en inglés, `tipo(scope): desc`.
  Cuerpo bajo 100 chars por línea (commitlint lo exige).
- El usuario hace los commits/push él mismo. NO commitear sin pedirlo.
- Último trabajo grande commiteado: personalización + artista + playlist CRUD.
  Pendiente de commitear: página de álbum, ColorHero, tinte global, fixes.

## PENDIENTES / próximos pasos

- **SIGUIENTE: Fase del "challenge" / juego** — nueva vista tipo /home /library
  /search: el juego "adivina la canción". El usuario quiere empezar con esto.
  (Plan original Fase 4/5. Fuente de tracks: replantear, ya NO se pueden usar
  playlists editoriales de Spotify — usar /search por género o pool del host.
  Modo host-reproduce-en-voz-alta: solo el host necesita Premium.)
- Manejo del 429 (mensaje claro + backoff) — opcional, el 429 es temporal.
- Al salir del artista, restaurar color de la canción que suena (pendiente).
- Portada custom de playlist (PUT /playlists/{id}/images, base64, <256KB).
- Toasts de confirmación (guardar me gusta / añadir a playlist).
- Menú "..." de TrackActions a solo-hover (opcional).
