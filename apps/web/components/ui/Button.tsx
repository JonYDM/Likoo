import { forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/cn"

/**
 * buttonVariants: define las VARIANTES del botón con cva.
 *
 * - Primer argumento: clases BASE (siempre presentes).
 * - `variants`: cada eje de variación (intent, size) con sus opciones.
 * - `defaultVariants`: qué se usa si no se especifica.
 *
 * Todas las clases de color usan TOKENS semánticos (bg-primary, text-foreground,
 * border-border...), nunca colores crudos. Así, cuando el tema cambie, el botón
 * cambia solo — clave para la personalización futura de la UI.
 */
const buttonVariants = cva(
  // Base: layout, tipografía, foco accesible y transición CSS (sin JS).
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
    "transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring " +
    "disabled:pointer-events-none disabled:opacity-50 hover:cursor-pointer hover:scale-[1.02] ",
  {
    variants: {
      intent: {
        // Acción principal: azul metálico.
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover",
        // Secundaria: superficie neutra con borde.
        secondary:
          "bg-surface text-foreground border border-border hover:bg-surface-hover",
        // Terciaria/discreta: sin fondo hasta el hover.
        ghost: "bg-transparent text-foreground hover:bg-surface-hover",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
    },
  },
)

/**
 * Props del botón = props nativas de <button> + las variantes de cva.
 * VariantProps extrae automáticamente los tipos de `intent` y `size`.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/**
 * forwardRef: permite pasar una ref al <button> real (útil para foco, libs, etc.).
 * `cn(...)` mezcla las variantes con cualquier className que pase el consumidor,
 * resolviendo conflictos de Tailwind.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ intent, size }), className)}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { buttonVariants }
