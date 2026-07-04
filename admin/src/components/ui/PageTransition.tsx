import React from 'react'
import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'

interface PageTransitionProps extends HTMLMotionProps<'div'> {
    className?: string
    children: React.ReactNode
}

/**
 * PageTransition — Premium but lightweight entry animation for pages.
 * Switched to hardware-accelerated transforms for zero-lag feel.
 */
export const PageTransition = ({ className = '', children, ...props }: PageTransitionProps) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1], // Quintic ease — extremely smooth
        }}
        className={className}
        {...props}
    >
        {children}
    </motion.div>
)

interface StaggerItemProps extends HTMLMotionProps<'div'> {
    className?: string
    children: React.ReactNode
    delay?: number
}

/**
 * StaggerItem — Optimized for lightweight feel. 
 * Reduced duration and simplified easing to prevent the "laggy" feeling of heavy spring physics.
 */
export const StaggerItem = ({ className = '', children, delay = 0, ...props }: StaggerItemProps) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.99, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
            duration: 0.35,
            delay,
            ease: [0.33, 1, 0.68, 1], // Deceleration curve for "snappy" landing
        }}
        className={className}
        {...props}
    >
        {children}
    </motion.div>
)
