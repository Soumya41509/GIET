import React from 'react'
import { cn } from '../../utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = 'neutral', ...props }, ref) => {
        const variants = {
            success: 'bg-green-100 text-green-700 border-green-200',
            warning: 'bg-orange-100 text-orange-700 border-orange-200',
            error: 'bg-red-100 text-red-700 border-red-200',
            info: 'bg-blue-100 text-blue-700 border-blue-200',
            neutral: 'bg-slate-100 text-slate-700 border-slate-200',
        }

        return (
            <div
                ref={ref}
                className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2',
                    variants[variant],
                    className
                )}
                {...props}
            />
        )
    }
)
Badge.displayName = 'Badge'

export { Badge }
