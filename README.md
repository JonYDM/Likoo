# spotify-clone

Proyecto de aprendizaje: clon de Spotify en TypeScript, con un modo extra de juego
("adivina la canción") jugable con amigos. Inspirado en
[crmne/fastpotify](https://github.com/crmne/fastpotify), pero implementado en JS/TS
usando el flujo oficial OAuth Authorization Code + PKCE y el Web Playback SDK de
Spotify — sin ingeniería inversa de ningún protocolo.

## Estructura

```
apps/
  web/      # Next.js — UI, auth (PKCE), reproducción (Web Playback SDK)
  server/   # Node + Socket.io — servidor del juego en tiempo real
packages/
  shared/   # cliente de Spotify, PKCE, motor del juego (framework-agnostic)
```

## Requisitos

- Node 24 (ver `.nvmrc`)
- pnpm 10 (`corepack enable` si no lo tienes)

## Setup

```bash
pnpm install
```

Cada app necesita sus propias variables de entorno (`.env.local` en `apps/web`,
`.env` en `apps/server`) — ver los `.env.example` de cada una.

## Desarrollo

```bash
pnpm dev:web      # apps/web en http://127.0.0.1:3000
pnpm dev:server   # apps/server (servidor del juego)
```

## Versionado

Trunk-based: ramas cortas `feat/...`, `fix/...`, `refactor/...` sobre `main`,
merge por PR (squash), commits en formato
[Conventional Commits](https://www.conventionalcommits.org/). Los hitos de cada
fase se marcan como tags en `main` (`v0.1.0-phase1-auth`, etc).

## Fases

El plan completo de arquitectura y fases de construcción vive en
`docs/PLAN.md`.
