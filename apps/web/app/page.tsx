"use client"
import { useAuth } from "../lib/auth-context"

export default function Home() {
  const { accessToken, isLoading } = useAuth()

  if (isLoading) return <p>Cargando...</p>
  if (!accessToken) return <p>No autenticado</p>
  return <p>Token: {accessToken.slice(0, 20)}...</p>
}
