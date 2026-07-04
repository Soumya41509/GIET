import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, type LucideIcon } from 'lucide-react'
import { cn } from '../../utils/cn'
import { motion, AnimatePresence } from 'framer-motion'

interface Option {
    value: string
    label: string
}

interface GlassSelectProps {
    value: string
    onChange: (value: string) => void
    options: Option[]
    placeholder?: string
    icon?: LucideIcon
    className?: string
    disabled?: boolean
    required?: boolean
}

export const GlassSelect = ({
    value,
    onChange,
    options,
    placeholder = 'Select option',
    icon: Icon,
    className,
    disabled = false
}: GlassSelectProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
    const buttonRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isOpen &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        const handleScroll = (event: Event) => {
            // Only close if scroll is NOT from the dropdown itself
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        window.addEventListener('scroll', handleScroll, true)
        window.addEventListener('resize', handleScroll)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            window.removeEventListener('scroll', handleScroll, true)
            window.removeEventListener('resize', handleScroll)
        }
    }, [isOpen])

    const handleToggle = () => {
        if (disabled) return

        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            // Calculate available space below and above
            const spaceBelow = window.innerHeight - rect.bottom - 16 // 16px padding
            const spaceAbove = rect.top - 16 // 16px padding

            // Calculate actual dropdown height needed (40px per item + padding)
            const itemHeight = 40
            const dropdownPadding = 10
            const maxVisibleItems = 10 // Show max 12 items before scrolling
            const idealHeight = Math.min(options.length * itemHeight + dropdownPadding, maxVisibleItems * itemHeight + dropdownPadding)

            let topPosition = rect.bottom + 6
            let maxHeight = Math.min(idealHeight, spaceBelow - 10)
            let origin = 'top'

            // If not enough space below, show above
            if (spaceBelow < idealHeight && spaceAbove > spaceBelow) {
                maxHeight = Math.min(idealHeight, spaceAbove - 10)
                topPosition = rect.top - maxHeight - 6
                origin = 'bottom'
            }

            setDropdownStyle({
                position: 'fixed',
                top: `${topPosition}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                maxHeight: `${maxHeight}px`,
                zIndex: 99999,
                transformOrigin: origin
            })
        }
        setIsOpen(!isOpen)
    }

    const handleSelect = (newValue: string) => {
        onChange(newValue)
        setIsOpen(false)
    }

    return (
        <div className={cn("relative", className)}>
            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={cn(
                    "relative w-full h-full min-h-[48px] flex items-center justify-between rounded-xl border-2 px-4 text-sm font-medium transition-all duration-300 outline-none select-none",
                    isOpen
                        ? "border-cyan-500 ring-4 ring-cyan-500/10 bg-white"
                        : "border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200",
                    disabled && "opacity-50 cursor-not-allowed bg-slate-100",
                    Icon ? "pl-10" : "pl-4"
                )}
            >
                {Icon && (
                    <Icon className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300",
                        isOpen || value ? "text-cyan-600" : "text-slate-400"
                    )} />
                )}

                <span className={cn(
                    "truncate",
                    !selectedOption ? "text-slate-400" : "text-slate-700"
                )}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown className={cn(
                        "ml-2 h-4 w-4 shrink-0 transition-colors duration-300",
                        isOpen ? "text-cyan-600" : "text-slate-400"
                    )} />
                </motion.div>
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <div
                            ref={dropdownRef}
                            style={dropdownStyle}
                            className="fixed flex flex-col overflow-hidden rounded-xl border border-white/60 bg-white/95 shadow-2xl shadow-slate-200/50 backdrop-blur-xl ring-1 ring-black/5 z-[99999]"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="flex flex-col h-full"
                            >
                                <div className="overflow-y-auto p-1.5 custom-scrollbar max-h-[inherit]">
                                    {options.map((option) => {
                                        const isSelected = value === option.value
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => handleSelect(option.value)}
                                                className={cn(
                                                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                                                    isSelected
                                                        ? "bg-cyan-50 text-cyan-700"
                                                        : "text-slate-600 hover:bg-slate-100"
                                                )}
                                            >
                                                <span className="truncate">{option.label}</span>
                                                {isSelected && <Check className="h-4 w-4 text-cyan-600" />}
                                            </button>
                                        )
                                    })}
                                    {options.length === 0 && (
                                        <div className="p-3 text-center text-xs text-slate-400">
                                            No options available
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    )
}
