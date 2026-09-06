
  "use client"

  import { useEffect, useRef } from "react"
  import { useAuth } from "./auth-context"
  import { usePlayerStore } from "./player-store"

  const SDK_SRC = "https://sdk.scdn.co/spotify-player.js"

  /**
   * Carga el Web Playback SDK, crea el player y sincroniza sus eventos con el
   * store de Zustand. No renderiza UI; solo orquesta el SDK.
   */
  export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const { accessToken } = useAuth()
    const playerRef = useRef<Spotify.Player | null>(null)

    // Guardamos el token en un ref para que getOAuthToken siempre lea el más
    // reciente sin recrear el player cada vez que el token se refresca.
    const tokenRef = useRef(accessToken)
    useEffect(() => {
      tokenRef.current = accessToken
    }, [accessToken])

    const {
      setDeviceId,
      setReady,
      setPremiumRequired,
      setPlaybackState,
      setPlayer,
    } = usePlayerStore()

    // ¿Hay sesión? (booleano estable). Usamos esto —no el valor del token— como
    // dependencia del effect de creación, para que el player se cree UNA vez y
    // NO se destruya/recree cada vez que el token se refresca (el getOAuthToken
    // ya lee el token fresco vía tokenRef).
    const hasToken = !!accessToken

    useEffect(() => {
      // Sin sesión aún → no inicializamos.
      if (!hasToken) return
      // Ya hay player creado → no dupliques.
      if (playerRef.current) return

      // Función que llama el SDK cuando termina de cargar.
      function initPlayer() {
        const player = new window.Spotify.Player({
          name: "Spotify Clone (Web)",
          getOAuthToken: (cb) => {
            // El SDK pide el token aquí; le damos el más reciente.
            if (tokenRef.current) cb(tokenRef.current)
          },
          volume: 0.5,
        })

        // Dispositivo listo → guardamos su id.
        player.addListener("ready", ({ device_id }) => {
          setDeviceId(device_id)
          setReady(true)
        })

        player.addListener("not_ready", () => {
          setReady(false)
        })

        // Cuenta no-Premium u otro error de cuenta.
        player.addListener("account_error", () => {
          setPremiumRequired(true)
        })

        // Cambió lo que suena → actualizamos el store.
        player.addListener("player_state_changed", (state) => {
          if (!state) return
          const t = state.track_window.current_track
          setPlaybackState({
            isPaused: state.paused,
            positionMs: state.position,
            durationMs: state.duration,
            currentTrack: {
              id: t.id,
              name: t.name,
              artists: t.artists.map((a: { name: string }) => a.name).join(", "),
              albumArt: t.album.images[0]?.url,
            },
          })
        })

        player.connect()
        playerRef.current = player
        setPlayer(player)
      }

      // Si el SDK ya cargó, inicializa; si no, espera al callback global.
      if (window.Spotify) {
        initPlayer()
      } else {
        window.onSpotifyWebPlaybackSDKReady = initPlayer
        // Inyecta el script del SDK una sola vez.
        if (!document.querySelector(`script[src="${SDK_SRC}"]`)) {
          const script = document.createElement("script")
          script.src = SDK_SRC
          script.async = true
          document.body.appendChild(script)
        }
      }

      // Cleanup: al desmontar de verdad (no en cada refresh), desconecta.
      return () => {
        playerRef.current?.disconnect()
        playerRef.current = null
        setPlayer(null)
      }
    }, [hasToken, setDeviceId, setReady, setPremiumRequired, setPlaybackState, setPlayer])

    return <>{children}</>
  }