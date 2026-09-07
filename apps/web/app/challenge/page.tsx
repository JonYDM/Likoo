"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  answerRound,
  buildRounds,
  createGame,
  nextRound as advanceRound,
  currentRound as getCurrentRound,
  type GameConfig,
  type GameState,
  type GameTrack,
} from "@spotify-clone/shared"
import { useGamePool } from "../../lib/hooks/use-game-pool"
import { usePlayTrack } from "../../lib/hooks/use-play-track"
import { usePlayerStore } from "../../lib/player-store"
import { GenrePicker } from "../../components/game/GenrePicker"
import { RoundPlayer } from "../../components/game/RoundPlayer"
import { GameResult } from "../../components/game/GameResult"

const TOTAL_ROUNDS = 8
const SECONDS_PER_ROUND = 15
const MS_TOTAL = SECONDS_PER_ROUND * 1000

/**
 * Vista del Reto (/challenge): "adivina la canción".
 *
 * Máquina de estados sobre GameState (motor puro en @spotify-clone/shared).
 * Fases: setup (elegir género) → loading (cargar pool) → playing/revealed
 * (rondas) → finished (resultado). El pool se pide una vez; las rondas se
 * barajan en memoria (cero peticiones por ronda → sin rate limit).
 *
 * Nota linter (React Compiler): NO se hace setState síncrono en effects. La
 * partida se construye en callbacks (tras refetch del pool); el temporizador
 * hace setState solo dentro del callback del interval.
 */
export default function ChallengePage() {
  const [genre, setGenre] = useState<string | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [game, setGame] = useState<GameState | null>(null)
  const [msRemaining, setMsRemaining] = useState(MS_TOTAL)
  const deadlineRef = useRef<number>(0)

  const { refetch } = useGamePool(genre ?? "", false)
  const playTrack = usePlayTrack()
  const seek = usePlayerStore((s) => s.seek)
  const player = usePlayerStore((s) => s.player)
  const setHideTrackInfo = usePlayerStore((s) => s.setHideTrackInfo)

  const round = game ? getCurrentRound(game) : undefined
  const phase = game?.phase
  const roundIndex = game?.currentRound ?? 0

  // Construye una partida a partir de un pool ya cargado.
  const startGameFromPool = useCallback(
    (pool: GameTrack[]) => {
      const config: GameConfig = {
        genre: genre ?? "",
        totalRounds: TOTAL_ROUNDS,
        secondsPerRound: SECONDS_PER_ROUND,
      }
      setGame(createGame(config, buildRounds(pool, TOTAL_ROUNDS)))
    },
    [genre],
  )

  // Jugar: carga el pool (o lo toma de cache) y arranca. setState en callback.
  const handleStart = useCallback(async () => {
    setPreparing(true)
    setErrorMsg(null)
    const { data, error } = await refetch()
    setPreparing(false)
    if (error) {
      setErrorMsg(
        "No se pudo cargar el género. Puede ser un límite temporal de Spotify (429): espera un momento e intenta de nuevo.",
      )
      return
    }
    if (!data || data.length < 4) {
      setErrorMsg("No hay suficientes canciones para este género. Prueba con otro.")
      return
    }
    startGameFromPool(data)
  }, [refetch, startGameFromPool])

  // Al empezar una ronda (playing): reproducir la canción desde su punto y
  // arrancar el temporizador. El setState del tiempo ocurre dentro del interval.
  useEffect(() => {
    if (phase !== "playing" || !round) return

    let cancelled = false
    const startPlayback = async () => {
      await playTrack(round.track.uri)
      window.setTimeout(() => {
        if (!cancelled) seek(round.startMs)
      }, 400)
    }
    void startPlayback()

    deadlineRef.current = Date.now() + MS_TOTAL
    const id = window.setInterval(() => {
      const left = deadlineRef.current - Date.now()
      setMsRemaining(Math.max(0, left))
    }, 100)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundIndex])

  // Ocultar la info del reproductor mientras se juega (sin revelar), para no
  // spoilear la canción en el PlayerBar del host. Se limpia al salir de /reto.
  useEffect(() => {
    setHideTrackInfo(phase === "playing")
  }, [phase, setHideTrackInfo])

  useEffect(() => {
    return () => setHideTrackInfo(false)
  }, [setHideTrackInfo])

  const handleAnswer = useCallback(
    (trackId: string) => {
      setGame((g) => {
        if (!g || g.phase !== "playing") return g
        const left = Math.max(0, deadlineRef.current - Date.now())
        const { state } = answerRound(g, trackId, left)
        return state
      })
      player?.pause()
    },
    [player],
  )

  // Fallo por tiempo agotado: marca incorrecta (respuesta vacía) y revela.
  // El setState vive en el callback (handleAnswer).
  useEffect(() => {
    if (phase === "playing" && msRemaining <= 0) {
      handleAnswer("")
    }
  }, [phase, msRemaining, handleAnswer])

  const handleNext = useCallback(() => {
    setGame((g) => (g ? advanceRound(g) : g))
  }, [])

  // Si se reveló por tiempo agotado (no eligió opción), avanzar solo tras una
  // breve pausa para que vea la respuesta correcta.
  useEffect(() => {
    if (phase === "revealed" && game?.selectedTrackId === "") {
      const id = window.setTimeout(() => handleNext(), 2500)
      return () => window.clearTimeout(id)
    }
  }, [phase, game?.selectedTrackId, handleNext])

  const resetToSetup = useCallback(() => {
    player?.pause()
    setGame(null)
    setGenre(null)
    setErrorMsg(null)
  }, [player])

  const playAgain = useCallback(async () => {
    const { data } = await refetch()
    if (data && data.length >= 4) startGameFromPool(data)
  }, [refetch, startGameFromPool])

  return (
    <main className="no-scrollbar h-full w-full overflow-y-auto">
      {/* SETUP */}
      {!game && (
        <>
          <GenrePicker
            selected={genre}
            onSelect={(g) => {
              setGenre(g)
              setErrorMsg(null)
            }}
            onStart={handleStart}
            disabled={preparing}
          />
          {errorMsg && (
            <p className="px-6 text-center text-red-400">{errorMsg}</p>
          )}
        </>
      )}

      {/* JUGANDO / REVELADO */}
      {game && round && (phase === "playing" || phase === "revealed") && (
        <RoundPlayer
          round={round}
          roundNumber={roundIndex + 1}
          totalRounds={game.rounds.length}
          msRemaining={msRemaining}
          msTotal={MS_TOTAL}
          revealed={phase === "revealed"}
          selectedTrackId={game.selectedTrackId}
          score={game.score}
          streak={game.streak}
          onAnswer={handleAnswer}
          onNext={handleNext}
        />
      )}

      {/* RESULTADO */}
      {game && phase === "finished" && (
        <GameResult
          state={game}
          onPlayAgain={playAgain}
          onChangeGenre={resetToSetup}
        />
      )}
    </main>
  )
}
