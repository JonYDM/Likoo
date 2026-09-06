/**
 * Saludos/frases gancho según la hora del día (estilo CLI/Claude).
 *
 * Función pura y barata: dado una hora (0-23) y opcionalmente un nombre,
 * devuelve una frase. Sin efectos, sin I/O — se llama una vez al render.
 *
 * IMPORTANTE: elegir la frase (que usa aleatoriedad/hora) debe hacerse en el
 * CLIENTE para evitar "hydration mismatch" en Next (el server y el cliente
 * podrían elegir distinto). Por eso los componentes que la usan la calculan
 * tras montar.
 */

type Band = "madrugada" | "manana" | "tarde" | "noche"

function band(hour: number): Band {
  if (hour < 6) return "madrugada"
  if (hour < 12) return "manana"
  if (hour < 19) return "tarde"
  return "noche"
}

// Frases por franja. {name} se reemplaza por el nombre (o se limpia si no hay).
const PHRASES: Record<Band, string[]> = {
  madrugada: [
    "¿Trasnochando, {name}?",
    "La madrugada tiene su propio soundtrack",
    "Shhh… la noche es larga, {name}",
    "Música para desvelados",
  ],
  manana: [
    "Buenos días, {name}",
    "Arranca el día con algo bueno",
    "¿Qué suena esta mañana?",
    "Café y música, {name}",
  ],
  tarde: [
    "Buenas tardes, {name}",
    "¿Qué escuchamos esta tarde?",
    "La tarde pide buena música",
    "Sigamos el ritmo, {name}",
  ],
  noche: [
    "Buenas noches, {name}",
    "Pon algo bueno para cerrar el día",
    "La noche es tuya, {name}",
    "¿Qué suena esta noche?",
  ],
}

export interface GreetingOptions {
  /** Nombre del usuario. Si no se pasa, las frases se limpian sin nombre. */
  name?: string | null
  /** Hora 0-23 (por defecto, la actual). Útil para tests. */
  hour?: number
  /** Índice de frase (por defecto aleatorio). Útil para tests. */
  index?: number
}

/** Devuelve una frase gancho acorde a la hora. */
export function getGreeting(opts: GreetingOptions = {}): string {
  const hour = opts.hour ?? new Date().getHours()
  const phrases = PHRASES[band(hour)]
  const i = opts.index ?? Math.floor(Math.random() * phrases.length)
  const phrase = phrases[i % phrases.length] ?? phrases[0]!

  const name = opts.name?.trim()
  return name
    ? phrase.replace("{name}", name)
    : // Sin nombre: quitamos ", {name}" o " {name}" y limpiamos.
      phrase
        .replace(/,?\s*\{name\}/g, "")
        .replace(/\s+\?/g, "?")
        .trim()
}
