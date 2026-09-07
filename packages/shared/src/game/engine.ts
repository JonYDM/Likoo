/**
 * Motor del juego "Adivina la canción" — funciones PURAS, sin I/O.
 *
 * No hay red, ni Spotify SDK, ni React aquí: solo transforma estado. Así es
 * testeable al 100% y reutilizable en el multijugador (Fase 5).
 */
import type {
  AnswerOption,
  AnswerResult,
  GameConfig,
  GameState,
  GameTrack,
  Round,
} from "./types"

/** Puntos máximos por ronda (si aciertas al instante). */
const MAX_POINTS = 1000
/** Puntos mínimos por acertar (aunque tardes todo el tiempo). */
const MIN_POINTS = 100
/** Bonus por cada acierto encadenado (racha). */
const STREAK_BONUS = 50

/**
 * Baraja una copia del array (Fisher-Yates). No muta el original.
 * `rng` inyectable para tests deterministas (default Math.random).
 */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = a[i] as T
    a[i] = a[j] as T
    a[j] = tmp
  }
  return a
}

/**
 * Construye las opciones de una ronda: la correcta + (n-1) señuelos tomados
 * del resto del pool, todo barajado.
 */
export function buildOptions(
  correct: GameTrack,
  pool: readonly GameTrack[],
  optionCount = 4,
  rng: () => number = Math.random,
): AnswerOption[] {
  const decoys = shuffle(
    pool.filter((t) => t.id !== correct.id),
    rng,
  ).slice(0, Math.max(0, optionCount - 1))

  const options: AnswerOption[] = [correct, ...decoys].map((t) => ({
    trackId: t.id,
    label: t.title,
  }))
  return shuffle(options, rng)
}

/**
 * Prepara todas las rondas de la partida a partir del pool de canciones.
 * Elige `totalRounds` canciones distintas como "correctas" y arma sus opciones.
 * Devuelve menos rondas si el pool es pequeño.
 */
export function buildRounds(
  pool: readonly GameTrack[],
  totalRounds: number,
  rng: () => number = Math.random,
): Round[] {
  const picks = shuffle(pool, rng).slice(0, Math.min(totalRounds, pool.length))
  return picks.map((track) => ({
    track,
    options: buildOptions(track, pool, 4, rng),
    // Punto de inicio aleatorio entre 0 y 30s (evita siempre la intro).
    startMs: Math.floor(rng() * 30_000),
  }))
}

/** Puntos por acertar según el tiempo restante (más rápido = más puntos). */
export function scoreForAnswer(
  msRemaining: number,
  msTotal: number,
  currentStreak: number,
): number {
  const ratio = msTotal > 0 ? Math.max(0, Math.min(1, msRemaining / msTotal)) : 0
  const base = Math.round(MIN_POINTS + (MAX_POINTS - MIN_POINTS) * ratio)
  return base + currentStreak * STREAK_BONUS
}

/** Crea el estado inicial de una partida ya con las rondas preparadas. */
export function createGame(config: GameConfig, rounds: Round[]): GameState {
  return {
    phase: rounds.length > 0 ? "playing" : "finished",
    config,
    rounds,
    currentRound: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    selectedTrackId: null,
  }
}

/**
 * Responde la ronda actual. Devuelve el nuevo estado (fase "revealed") y el
 * resultado para el feedback en UI. Idempotente si ya se respondió.
 */
export function answerRound(
  state: GameState,
  selectedTrackId: string,
  msRemaining: number,
): { state: GameState; result: AnswerResult } {
  const round = state.rounds[state.currentRound]
  if (!round || state.phase !== "playing") {
    return {
      state,
      result: {
        wasCorrect: false,
        pointsEarned: 0,
        correctTrackId: round?.track.id ?? "",
      },
    }
  }
  const correctTrackId = round.track.id
  const wasCorrect = selectedTrackId === correctTrackId

  const msTotal = state.config.secondsPerRound * 1000
  const pointsEarned = wasCorrect
    ? scoreForAnswer(msRemaining, msTotal, state.streak)
    : 0
  const streak = wasCorrect ? state.streak + 1 : 0

  return {
    state: {
      ...state,
      phase: "revealed",
      selectedTrackId,
      score: state.score + pointsEarned,
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      correct: state.correct + (wasCorrect ? 1 : 0),
    },
    result: { wasCorrect, pointsEarned, correctTrackId },
  }
}

/** Avanza a la siguiente ronda, o termina la partida si era la última. */
export function nextRound(state: GameState): GameState {
  const next = state.currentRound + 1
  if (next >= state.rounds.length) {
    return { ...state, phase: "finished" }
  }
  return { ...state, phase: "playing", currentRound: next, selectedTrackId: null }
}

/** Devuelve la ronda actual (o undefined si terminó). */
export function currentRound(state: GameState): Round | undefined {
  return state.rounds[state.currentRound]
}
