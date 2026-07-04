import React, { useEffect } from 'react'
import { cn } from '../../utils/cn'

/**
 * GlassCard — Glassmorphism 2.0
 * ─────────────────────────────
 * backdrop-filter: blur(25px), subtle border, soft shadow.
 * Uses rounded-xl by default — callers can override with their own rounded-* class.
 */

const glassBase: React.CSSProperties = {
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    border: '1px solid rgba(255, 255, 255, 0.20)',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.08)',
}

let hoversInjected = false
function injectHoverStyles() {
    if (hoversInjected || typeof document === 'undefined') return
    hoversInjected = true
    const style = document.createElement('style')
    style.id = 'glass-card-hover'
    style.textContent = `
        .glass-card-root:hover {
            box-shadow: 0 20px 50px rgba(31, 38, 135, 0.12) !important;
        }
    `
    document.head.appendChild(style)
}

const GlassCard = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => {
    useEffect(() => {
        injectHoverStyles()
    }, [])

    return (
        <div
            ref={ref}
            className={cn(
                'glass-card-root rounded-xl text-slate-950 transition-all duration-300',
                className
            )}
            style={{ ...glassBase, ...style }}
            {...props}
        />
    )
})
GlassCard.displayName = 'GlassCard'

const GlassCardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6', className)}
        {...props}
    />
))
GlassCardHeader.displayName = 'GlassCardHeader'

const GlassCardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            'text-2xl font-semibold leading-none tracking-tight text-teal-900',
            className
        )}
        {...props}
    />
))
GlassCardTitle.displayName = 'GlassCardTitle'

const GlassCardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
GlassCardContent.displayName = 'GlassCardContent'

export { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent }
