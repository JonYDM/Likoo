"use client"

import { createContext, useContext, useEffect, useState, useRef } from "react"

type AuthContextValue = {
  accessToken: string | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  accessToken: null,
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function fetchToken() {
    const res = await fetch("/api/auth/token")
    if (!res.ok) {
      setAccessToken(null)
      setIsLoading(false)
      return
    }
    const { accessToken, expiresIn } = await res.json()
    setAccessToken(accessToken)
    setIsLoading(false)

    // Refresca 60 segundos antes de que expire
    timerRef.current = setTimeout(fetchToken, (expiresIn - 60) * 1000)
  }

  useEffect(() => {
    fetchToken()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <AuthContext value={{ accessToken, isLoading }}>
      {children}
    </AuthContext>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
