"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

type AuthContextValue = {
  accessToken: string | null
  isLoading: boolean
  /** Vuelve a pedir el access_token al servidor (tras login/OAuth). */
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  accessToken: null,
  isLoading: true,
  refresh: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Momento (epoch ms) en que expira el token actual. Dispara el auto-refresh.
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Una sola petición del token al BFF. No se reprograma a sí misma: el
  // auto-refresh recurrente lo maneja el useEffect de abajo observando
  // `expiresAt`. Estable, así sirve tanto para el montaje como para refresh().
  const fetchToken = useCallback(async () => {
    const res = await fetch("/api/auth/token")

    if (!res.ok) {
      setAccessToken(null)
      setExpiresAt(null)
      setIsLoading(false)
      return
    }

    const { accessToken, expiresIn } = await res.json()
    setAccessToken(accessToken)
    setExpiresAt(Date.now() + expiresIn * 1000)
    setIsLoading(false)
  }, [])

  // Carga inicial al montar el provider.
  useEffect(() => {
    let cancelled = false
    async function load() {
      await fetchToken()
    }
    if (!cancelled) load()
    return () => {
      cancelled = true
    }
  }, [fetchToken])

  // Auto-refresh: reprograma una nueva petición 60s antes de que expire el
  // token vigente. Se re-ejecuta cada vez que `expiresAt` cambia.
  useEffect(() => {
    if (expiresAt === null) return

    const msUntilRefresh = expiresAt - Date.now() - 60_000
    timerRef.current = setTimeout(fetchToken, Math.max(msUntilRefresh, 0))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [expiresAt, fetchToken])

  const logout = useCallback(async () => {
    // Para el timer de refresh para que no vuelva a pedir token tras salir.
    if (timerRef.current) clearTimeout(timerRef.current)
    // Borra la cookie httpOnly server-side.
    await fetch("/api/auth/logout", { method: "POST" })
    // Limpia el estado en memoria. El proxy hará el resto: sin cookie, cualquier
    // navegación a ruta protegida redirige a /login.
    setAccessToken(null)
    setExpiresAt(null)
  }, [])

  return (
    <AuthContext value={{ accessToken, isLoading, refresh: fetchToken, logout }}>
      {children}
    </AuthContext>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
