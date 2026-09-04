# Spotify Clone — Proyecto de aprendizaje (monorepo JS/TS)

## Contexto

El usuario quiere construir un clon de Spotify inspirado en [crmne/fastpotify](https://github.com/crmne/fastpotify), pero en JavaScript/TypeScript, como proyecto para aprender y ponerse a prueba como ingeniero. A diferencia de fastpotify (Rust + `librespot`, que reimplementa por ingeniería inversa el protocolo Spotify Connect para reproducir audio local), en JS no hace falta nada de eso: el login se hace con OAuth Authorization Code + PKCE oficial, y la reproducción con el **Web Playback SDK** oficial de Spotify (JS, corre en el navegador, 100% legítimo).

Objetivo: además del clon "core" (buscar, librería, playlists, reproducción) con una **UI totalmente distinta a la de Spotify**, añadir un modo de juego "adivina la canción" — eliges género, tienes ~3s para adivinar, juegas con amigos.

Dos restricciones reales de la plataforma que condicionan el diseño:
1. El Web Playback SDK solo reproduce tracks completos para cuentas **Premium** (Free puede buscar/navegar vía Web API pero no streamear vía SDK).
2. `preview_url` (clips de 30s sin Premium) fue retirado de la Web API para apps nuevas desde finales de 2024 — no se puede depender de él.

**Decisión de diseño que resuelve ambas restricciones para el juego:** modo presencial estilo Kahoot/Jackbox — un dispositivo "host" (con Premium) reproduce el audio en voz alta vía Web Playback SDK y lo pausa a los ~3s; el resto de jugadores solo necesitan el navegador abierto para adivinar. Así solo el host necesita Premium, no todos los jugadores. (Asunción confirmable por el usuario; si en el futuro se quiere modo remoto con audio independiente por jugador, la v2 natural es Deezer, que sigue exponiendo previews de 30s gratis.)

Este es un proyecto de aprendizaje: el scaffolding/config/boilerplate se monta de una vez, pero la lógica de cada feature se construye por fases para que el usuario la escriba con guía, no que aparezca ya hecha.

Decisiones ya tomadas con el usuario: monorepo con **pnpm workspaces** desde ya (pensando en móvil futuro), proyecto en `C:\Users\jonyo\spotify-clone` (carpeta vacía, confirmada).

## Arquitectura

### Layout del monorepo

```
spotify-clone/
├── package.json                  # root privado, scripts de workspace
├── pnpm-workspace.yaml
├── tsconfig.base.json            # compilerOptions compartidos
├── eslint.config.mjs             # flat config compartido
├── .prettierrc
├── .editorconfig
├── .nvmrc                        # 24.11.1
├── .gitignore
├── README.md
├── .github/workflows/ci.yml
├── apps/
│   ├── web/                      # Next.js 15, App Router, TS, Tailwind
│   │   ├── app/
│   │   │   ├── login/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   ├── playlist/[id]/page.tsx
│   │   │   ├── library/page.tsx
│   │   │   ├── game/page.tsx             # crear/unirse a sala
│   │   │   ├── game/[roomCode]/page.tsx  # lobby + ronda en vivo
│   │   │   └── api/
│   │   │       ├── auth/callback/route.ts   # intercambio de token PKCE
│   │   │       ├── auth/token/route.ts      # devuelve access_token fresco al cliente
│   │   │       ├── auth/logout/route.ts
│   │   │       └── game/session-token/route.ts  # emite JWT del juego
│   │   ├── components/{ui,player,track,layout}/
│   │   ├── lib/{spotify.ts,auth-context.tsx,query-client.ts,player-store.ts}
│   │   ├── middleware.ts         # protege rutas sin sesión
│   │   └── styles/globals.css
│   └── server/                   # Express/Fastify + Socket.io, proceso persistente
│       └── src/
│           ├── index.ts
│           ├── env.ts
│           ├── spotify/clientCredentials.ts   # token de app, NO de usuario
│           └── game/{rooms.ts,namespace.ts,jwt.ts}
└── packages/
    └── shared/                   # @spotify-clone/shared, agnóstico de framework
        └── src/
            ├── spotify/{client.ts,types.ts}
            ├── auth/pkce.ts
            ├── game/{types.ts,engine.ts,engine.test.ts,genres.ts}
            └── schemas/gameEvents.ts   # esquemas zod para eventos de socket
```

`pnpm-workspace.yaml`: `packages: [apps/*, packages/*]`. `apps/web` y `apps/server` dependen de `packages/shared` vía `"@spotify-clone/shared": "workspace:*"`.

**Deliberadamente no se crean todavía** `packages/ui` ni `packages/config`: compartir componentes visuales entre web (DOM/Tailwind) y móvil (React Native/StyleSheet) no es realista de diseñar bien antes de haber construido la UI web una vez. Lo único realmente compartible pronto son *design tokens* (colores, spacing) vía NativeWind — eso se evalúa en la Fase 6, no ahora.

### Auth

Dos flujos distintos, no confundir:

- **Auth de usuario** (Authorization Code + PKCE), vive en `apps/web`:
  1. El navegador genera `code_verifier`, lo guarda en cookie no-httpOnly `sp_pkce_verifier`, calcula `code_challenge = base64url(sha256(verifier))` y redirige a `accounts.spotify.com/authorize`. **Nota importante:** Spotify exige `127.0.0.1` (no `localhost`) como redirect URI local.
  2. Spotify redirige a `apps/web/app/api/auth/callback/route.ts` (server-side). Este intercambia `code` + `verifier` por tokens en `/api/token`.
  3. El `refresh_token` se guarda en cookie **httpOnly, Secure, SameSite=Lax** — nunca llega a JS del navegador.
  4. El Web Playback SDK necesita el `access_token` en JS. Patrón BFF: `GET /api/auth/token` lee la cookie httpOnly server-side, refresca si hace falta, devuelve el `access_token` como JSON a un `AuthContext` que lo guarda **solo en memoria** (nunca localStorage), con refetch ~60s antes de expirar.

- **Auth de app** (Client Credentials), vive en `apps/server`: token propio de la app (sin usuario) para leer playlists editoriales por género para el juego. El servidor de juego nunca toca el token del usuario.

- **Puente auth de usuario → sesión del juego**: `apps/web` expone `POST /api/game/session-token`, que valida la cookie de Spotify, llama a `/me` una vez, y firma un JWT corto (`GAME_JWT_SECRET`, compartido entre `apps/web` y `apps/server`) con `{sub, name, avatar}`. El cliente lo manda en el handshake de Socket.io; `apps/server` solo verifica la firma, sin llamar nunca a Spotify.

### UI / Styling

**Tailwind CSS v4 + Radix UI Primitives (sin estilos) + `class-variance-authority` (cva)**, componentes escritos a mano.

- Tailwind no es "magia": el usuario sigue tomando cada decisión de layout/spacing/color — solo evita escribir CSS a mano repetitivo. Como el objetivo es una UI que NO se parezca a Spotify, mantener las decisiones de diseño en manos del usuario es clave.
- Radix da solo comportamiento/accesibilidad (focus trap, teclado, ARIA) para cosas fiddly (Dialog, DropdownMenu, Slider de progreso) que no son el punto de aprendizaje del proyecto.
- **Evitar explícitamente** kits completos (MUI, Chakra) o copiar componentes ya hechos de shadcn/ui — se usa la misma técnica (Radix + cva + tailwind-merge) pero el usuario escribe `Button.tsx`, `Card.tsx`, `TrackRow.tsx` él mismo.
- Iconos: `lucide-react`. `framer-motion` se difiere a la Fase 6 (aprender transiciones CSS a mano primero).
- Estado: TanStack Query para datos de Spotify (cache/async), Zustand para estado global de UI (track actual, cola, volumen) — pequeño y legible en una tarde, buen contraste con Redux.
- Esta elección deja bien puesto el terreno para móvil: NativeWind permite reusar casi el mismo config de Tailwind en Expo/React Native.

### Módulo del juego ("adivina la canción")

- **Sourcing de tracks:** `packages/shared/src/game/genres.ts` mantiene un mapa estático género → IDs de playlists editoriales de Spotify. `apps/server` las lee vía `Get Playlist Items` con su token de Client Credentials (evita depender de la Recommendations API, restringida). Nota: los IDs de playlists editoriales a veces cambian — mantenimiento periódico esperado; v2 razonable: dejar que el host arme su propio pool vía Search.
- **Transporte:** un único namespace de Socket.io, `/game`. Cada sala = un room de Socket.io, con código corto tipo Kahoot (6 caracteres base32).
- **Forma del estado** (`packages/shared/src/game/types.ts`):
  ```ts
  type Player = { id: string; displayName: string; avatarUrl?: string; score: number; connected: boolean };

  type RoundState = {
    roundNumber: number;
    track: { id: string; name: string; artist: string; uri: string; albumArt?: string };
    choices?: string[];
    startedAt: number;
    durationMs: number;
    guesses: Record<string, { guess: string; submittedAt: number; correct?: boolean }>;
    status: 'countdown' | 'playing' | 'guessing' | 'reveal';
  };

  type RoomState = {
    code: string; hostId: string; genre: string;
    players: Record<string, Player>;
    settings: { roundCount: number; roundDurationMs: number; mode: 'multiple-choice' | 'free-text' };
    currentRound: RoundState | null;
    status: 'lobby' | 'in-round' | 'reveal' | 'finished';
  };
  ```
- **Ciclo de ronda:** host inicia → servidor elige todos los tracks de antemano → `round:play` solo al host (dispara `play()`/`pause()` del SDK a los ~3s), el resto recibe `round:listen` (solo UI de guess) → deadline decidido por el servidor (nunca por el cliente, evita trampas) → `guess:submit` → `round:reveal` con marcador → loop → `game:finished`.
- **Por qué la lógica vive en `packages/shared`:** `applyEvent(state: RoomState, event: GameEvent): RoomState` es una función pura, sin I/O, 100% testeable con Vitest. Los handlers de Socket.io en `apps/server` son delgados: validan payload (esquema zod, también en `packages/shared`) → llaman `applyEvent` → guardan el resultado en un `Map<roomCode, RoomState>` en memoria (sin DB, las partidas son efímeras — el adaptador Redis de Socket.io queda documentado como camino de escalado v2, no construido ahora) → broadcast. Esto deja el motor listo para que un futuro cliente Expo lo reuse tal cual.

### Versionado / Git

**Trunk-based con ramas de feature de vida corta — no git-flow** (git-flow existe para coordinar release trains entre varios equipos; en solitario es ceremonia sin beneficio).

- `main` siempre compila/lintea/pasa tests.
- Una rama por feature: `feat/phase1-pkce-login`, `feat/phase4-game-engine`, `fix/...`, `refactor/...`.
- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`), reforzado con `husky` + `commitlint` desde la Fase 0.
- Squash-merge vía PR (aunque sea en solitario) — hábito real, y buen lugar para dejar una nota corta de "qué aprendí" por PR.
- **Changesets: se omite por ahora** — está pensado para versionar/publicar paquetes de forma independiente; nada aquí se publica a npm todavía. Se reintroduce si `packages/shared` llega a consumirse desde un repo de móvil separado.
- Milestones de fase como tags directos en `main`: `v0.1.0-phase1-auth`, `v0.2.0-phase3-playback`, etc. — deja un historial narrable, útil como portfolio.
- `.github/workflows/ci.yml`: `pnpm install && pnpm -r lint && pnpm -r typecheck && pnpm -r test` en cada PR, desde la Fase 0. Deploy real se deja para la Fase 6.

## Fases de construcción

**Fase 0 — Tooling y scaffolding** *(scaffolding puro; enseña mecánica de monorepo)*
`git init`, `pnpm-workspace.yaml`, configs raíz, `pnpm create next-app` para `apps/web`, `apps/server` escrito a mano (es pequeño, escribirlo a mano no resta valor), scaffold de `packages/shared` (package.json/tsconfig/exports), husky+commitlint, esqueleto de CI, registro de la app en el Spotify Developer Dashboard (redirect URI `http://127.0.0.1:3000/api/auth/callback`) — guiado paso a paso si el usuario aún no la tiene creada.

**Fase 1 — Auth (PKCE)** *(el usuario implementa el flujo completo)*
`packages/shared/src/auth/pkce.ts`, redirect de login, `api/auth/callback/route.ts`, cookie httpOnly de refresh, `api/auth/token/route.ts` + `AuthContext` en memoria con timer de refresh, `middleware.ts`. Aprende: OAuth2 Authorization Code + PKCE de punta a punta, tradeoffs httpOnly vs JS-accesible, Route Handlers de Next.js.

**Fase 2 — Buscar / Librería / UI** *(el usuario implementa casi todo)*
Funciones de `packages/shared/src/spotify/client.ts`, hooks de TanStack Query, páginas custom de home/librería/búsqueda/playlist, primeros componentes `Button`/`Card`/`TrackRow` con cva — aquí se decide la identidad visual. Aprende: paginación, cache async, diseñar un sistema de componentes desde cero.

**Fase 3 — Reproducción vía Web Playback SDK** *(el usuario implementa)*
Init del SDK, `getOAuthToken` conectado al `AuthContext`, transferencia de dispositivo, `PlayerBar` global sincronizado con Zustand, manejo explícito de cuentas no-Premium (chequear `/me.product`, aviso claro en vez de fallo silencioso). Aprende: integración con SDK externo basado en eventos, sincronizar estado de dispositivo externo en React.

**Fase 4 — Motor del juego, solo local/un jugador** *(el usuario implementa; sin servidor todavía)*
`packages/shared/src/game/engine.ts` como reducer puro + tests con Vitest, pantalla de juego local que conduce el motor desde el cliente, sourcing de tracks desde playlists curadas. Aprende: diseño de máquina de estados, testing de funciones puras, diseñar alrededor de restricciones reales de una API de terceros.

**Fase 5 — Multijugador en tiempo real** *(el usuario implementa; la fase más rica)*
Namespace `/game` de `apps/server` envolviendo el motor de la Fase 4, JWT de `api/game/session-token` + verificación server-side, UI de lobby, ciclo de ronda server-authoritative completo, UX de host-reproduce-en-voz-alta/resto-adivina, manejo de desconexión/reconexión. Aprende: programación WebSocket, estado server-authoritative ("nunca confíes en el cliente" para nada que puntúe), feature full-stack en tiempo real completa.

**Fase 6 — Pulido y preparación móvil**
Pase de animación (aquí sí entra `framer-motion`), pase de accesibilidad, exploración opcional del adaptador Redis, deploy (`apps/web`→Vercel, `apps/server`→Fly.io/Railway, necesita WebSockets de larga duración, no un target serverless), luego scaffold de `apps/mobile` (Expo) importando `packages/shared` tal cual, evaluar NativeWind, y anotar la restricción real de que el Web Playback SDK es solo-web — un cliente nativo necesitaría el App Remote SDK de Spotify o un deep-link.

## Verificación

- **Fase 0:** `pnpm install` corre sin errores en la raíz; `pnpm -r lint`/`pnpm -r typecheck` pasan en los 3 paquetes vacíos; CI verde en un PR de prueba.
- **Fase 1:** login real contra Spotify funciona end-to-end en `http://127.0.0.1:3000` — redirect, callback, cookie httpOnly visible en devtools (Application → Cookies), `/api/auth/token` devuelve un access_token válido.
- **Fase 2:** búsqueda y librería muestran datos reales de la cuenta del usuario; paginación funciona; UI visualmente distinta de Spotify (validación manual/visual).
- **Fase 3:** reproducir un track real en el navegador vía SDK, con cuenta Premium; verificar manejo del caso no-Premium.
- **Fase 4:** `pnpm --filter @spotify-clone/shared test` pasa los tests del engine; modo local de juego jugable de principio a fin.
- **Fase 5:** probar con 2+ pestañas/dispositivos en la misma red local uniéndose a una sala, completando una partida completa con marcador correcto.
