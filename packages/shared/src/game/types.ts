/**
 * Tipos del juego "Adivina la canción" (v1 local).
 *
 * Diseñado agnóstico de framework y de red: la lógica (engine.ts) es pura, así
 * se reutiliza tal cual en el multijugador (Fase 5) moviendo el mismo estado
 * por socket. Aquí NO se importa nada de Spotify SDK ni de React.
 */

/** Canción mínima para el juego (subset de SpotifyTrack, para no acoplar). */
export interface GameTrack {
  id: string
  uri: string
  title: string
  artist: string
  /** Carátula, para revelar tras responder. */
  imageUrl?: string
}

/** Una opción de respuesta mostrada al jugador. */
export interface AnswerOption {
  /** id del track que representa esta opción. */
  trackId: string
  /** Texto visible (título de la canción). */
  label: string
}

/** Una ronda ya preparada: la canción correcta + las opciones barajadas. */
export interface Round {
  /** Track que suena y hay que adivinar. */
  track: GameTrack
  /** 4 opciones (1 correcta + señuelos), ya barajadas. */
  options: AnswerOption[]
  /** Segundo de inicio de la reproducción (punto aleatorio). */
  startMs: number
}

/** Fases de la máquina de estados de la partida. */
export type GamePhase = "setup" | "loading" | "playing" | "revealed" | "finished"

/** Configuración elegida en el setup. */
export interface GameConfig {
  /** Género buscado (o "mixed"). */
  genre: string
  /** Número de rondas de la partida. */
  totalRounds: number
  /** Segundos por ronda para responder. */
  secondsPerRound: number
}

/** Estado completo de la partida local. */
export interface GameState {
  phase: GamePhase
  config: GameConfig
  /** Rondas preparadas para toda la partida. */
  rounds: Round[]
  /** Índice de la ronda actual (0-based). */
  currentRound: number
  /** Puntaje acumulado. */
  score: number
  /** Racha de aciertos consecutivos. */
  streak: number
  /** Mejor racha de la partida. */
  bestStreak: number
  /** Aciertos totales. */
  correct: number
  /** trackId elegido en la ronda actual (null si aún no responde). */
  selectedTrackId: string | null
}

/** Resultado de responder una ronda (para feedback en UI). */
export interface AnswerResult {
  wasCorrect: boolean
  pointsEarned: number
  correctTrackId: string
}
