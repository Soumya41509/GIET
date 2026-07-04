import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface TooltipProps {
    children: React.ReactNode;
    content: React.ReactNode;
    delay?: number;
    side?: 'top' | 'bottom';
    variant?: 'dark' | 'light';
}

export const Tooltip: React.FC<TooltipProps> = ({
    children,
    content,
    delay = 0.2,
    side = 'top',
    variant = 'dark'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number | null>(null);

    const updateCoords = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
        }
    }, []);

    const handleMouseEnter = () => {
        updateCoords(); // Get initial coordinates
        timeoutRef.current = window.setTimeout(() => {
            setIsVisible(true);
        }, delay * 1000);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    useEffect(() => {
        if (isVisible) {
            // Update coords on scroll and resize when tooltip is visible
            window.addEventListener('scroll', updateCoords, true); // Use capture phase for scroll
            window.addEventListener('resize', updateCoords);
            updateCoords(); // Ensure coords are up-to-date immediately after visibility change
        }
        return () => {
            // Cleanup event listeners
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isVisible, updateCoords]);

    const isTop = side === 'top';
    const isDark = variant === 'dark';

    return (
        <div
            ref={triggerRef}
            className="inline-flex items-center justify-center cursor-help"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {isVisible && coords && createPortal(
                <div
                    className="fixed inset-0 pointer-events-none z-[9999999]"
                    style={{ overflow: 'hidden' }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: isTop ? 10 : -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: isTop ? 10 : -10 }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                                opacity: { duration: 0.1 }
                            }}
                            style={{
                                position: 'fixed',
                                top: isTop ? coords.top : coords.top + coords.height,
                                left: coords.left + (coords.width / 2),
                                transform: `translateX(-50%) ${isTop ? 'translateY(-100%)' : ''}`,
                                marginTop: isTop ? '-12px' : '12px',
                                marginBottom: isTop ? '12px' : '-12px'
                            }}
                            className="w-max max-w-xs"
                        >
                            <div className={`filter drop-shadow-2xl relative px-4 py-3 rounded-2xl ring-1 ${isDark
                                ? 'bg-slate-900 border-white/10 ring-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)]'
                                : 'bg-white border-slate-200 ring-slate-200 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border'
                                }`}>
                                <div className="relative z-10 text-[11px] font-bold leading-relaxed whitespace-pre-wrap">
                                    {content}
                                </div>
                                <div className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-[6px] border-transparent ${isTop
                                    ? (isDark ? 'top-full border-t-slate-900' : 'top-full border-t-white')
                                    : (isDark ? 'bottom-full border-b-slate-900' : 'bottom-full border-b-white')
                                    }`} />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </div>
    );
};
