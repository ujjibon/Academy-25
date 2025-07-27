import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#D35400] to-[#FFB347] text-white hover:brightness-110 hover:shadow-lg",
        destructive:
          "bg-gradient-to-r from-orange-dark to-red-500 text-white hover:brightness-110 hover:shadow-lg",
        outline:
          "border border-orange bg-white text-orange-dark hover:bg-orange-light hover:text-orange-dark hover:shadow-md hover:scale-105",
        secondary:
          "bg-white text-orange-dark border border-orange hover:bg-orange-light hover:text-orange-dark hover:shadow-md hover:scale-105",
        ghost: "hover:bg-orange-light hover:text-orange-dark hover:shadow-md hover:scale-105",
        link: "text-orange underline-offset-4 hover:underline hover:text-orange-dark",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
