import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '../../utils/cn'

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
    size?: 'sm' | 'md' | 'lg' | 'icon'
}

const GlassButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button'

        const variants = {
            primary: 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:brightness-110 border border-transparent',
            secondary: 'bg-white/60 border border-white/60 text-teal-900 hover:bg-white/80 shadow-sm',
            ghost: 'hover:bg-white/40 text-teal-900',
            destructive: 'bg-red-500/90 text-white hover:bg-red-600 shadow-sm',
            outline: 'border border-cyan-500/40 text-cyan-700 hover:bg-cyan-50/50'
        }

        const sizes = {
            sm: 'h-8 px-3 text-xs rounded-lg',
            md: 'h-10 px-4 py-2 rounded-xl',
            lg: 'h-12 px-6 text-lg rounded-2xl',
            icon: 'h-10 w-10 p-2 rounded-xl flex items-center justify-center'
        }

        return (
            <Comp
                className={cn(
                    'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
                    variants[variant],
                    sizes[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
GlassButton.displayName = 'GlassButton'

export { GlassButton }
