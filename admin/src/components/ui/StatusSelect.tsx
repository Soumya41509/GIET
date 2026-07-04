import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

interface StatusSelectProps {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    className?: string
}

const statusConfig: Record<string, { bg: string, text: string, border: string, iconColor: string }> = {
    'Resolved': { bg: 'bg-green-50/80', text: 'text-green-700', border: 'border-green-200/50', iconColor: 'text-green-600' },
    'In Progress': { bg: 'bg-yellow-50/80', text: 'text-yellow-700', border: 'border-yellow-200/50', iconColor: 'text-yellow-600' },
    'Submitted': { bg: 'bg-slate-50/80', text: 'text-slate-700', border: 'border-slate-200/50', iconColor: 'text-slate-500' },
}

export const StatusSelect = ({ value, onChange, disabled, className = '' }: StatusSelectProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
    const buttonRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const currentConfig = statusConfig[value] || statusConfig['Submitted']

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

        const handleScroll = () => {
            if (isOpen) setIsOpen(false)
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
            setDropdownStyle({
                position: 'fixed',
                top: `${rect.bottom + 4}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                zIndex: 9999
            })
        }
        setIsOpen(!isOpen)
    }

    const handleSelect = (newValue: string) => {
        if (newValue !== value) {
            onChange(newValue)
        }
        setIsOpen(false)
    }

    return (
        <div className={`relative ${className}`}>
            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`w-full flex items-center justify-between rounded-xl border px-6 py-3 text-base font-medium backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${currentConfig.bg} ${currentConfig.text} ${currentConfig.border} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-opacity-100 shadow-sm hover:shadow-md'}`}
            >
                <span>{value}</span>
                <ChevronDown className={`ml-3 h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''} ${currentConfig.iconColor}`} />
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    style={dropdownStyle}
                    className="overflow-hidden rounded-xl border border-white/40 bg-white/90 p-1.5 shadow-xl backdrop-blur-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
                >
                    {Object.keys(statusConfig).map((status) => {
                        const config = statusConfig[status]
                        const isSelected = value === status
                        return (
                            <button
                                key={status}
                                onClick={() => handleSelect(status)}
                                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-colors ${isSelected ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100/50'}`}
                            >
                                <span className={`flex items-center gap-3 ${config.text}`}>
                                    <span className={`h-2.5 w-2.5 rounded-full ${config.bg.replace('/80', '')} ring-1 ring-inset ${config.border}`} />
                                    {status}
                                </span>
                                {isSelected && <Check className="h-5 w-5 text-teal-600" />}
                            </button>
                        )
                    })}
                </div>,
                document.body
            )}
        </div>
    )
}
