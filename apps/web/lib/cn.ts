import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * cn(): combina clases de forma segura.
 *
 * - clsx: acepta strings, objetos y condiciones → construye la lista de clases.
 * - twMerge: resuelve conflictos entre clases de Tailwind (p.ej. si llegan
 *   `p-2` y `p-4`, gana la última) para que puedas sobrescribir estilos sin
 *   pelear con la especificidad.
 *
 * Es el patrón estándar para componentes con variantes (cva) + overrides.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
