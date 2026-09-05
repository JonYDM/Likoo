import { forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/cn"


const cardVariants = cva(
    "bg-surface border border-border rounded-lg",{
        variants: {
            padding:{
                none: "",
                sm: "p-3",
                md: "p-4",
                lg: "p-6"
            },
            interactive:{
                true: "transition-colors hover:bg-surface-hover cursor-pointer",
                false: "",
            },        
        },
        defaultVariants: {
            padding: "md",
            interactive:false,
        }
    }
)

export interface CardProps
    extends React.HTMLAttributes<HTMLDivElement>,
      VariantProps<typeof cardVariants> {}

  export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, padding, interactive, ...props }, ref) => {
      return (
        <div
          ref={ref}
          className={cn(cardVariants({ padding, interactive }), className)}
          {...props}
        />
      )
    },
  )
  Card.displayName = "Card"

  export { cardVariants }