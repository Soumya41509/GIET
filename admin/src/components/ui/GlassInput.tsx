import React from 'react'
import { cn } from '../../utils/cn'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const GlassInput = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    'flex h-10 w-full rounded-xl border border-white/60 bg-white/50 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 transition-all duration-200',
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
GlassInput.displayName = 'GlassInput'

export { GlassInput }
