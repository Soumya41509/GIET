import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import { GlassInput } from '../ui/GlassInput'

const GlassTopbar = () => {
    const location = useLocation()

    return (
        <header className="fixed left-64 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-white/40 bg-[#bef7ed]/80 px-6 backdrop-blur-xl">
            <div className="w-96">
                {location.pathname !== '/' && location.pathname !== '/reports' && location.pathname !== '/grievances' && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <GlassInput
                            placeholder="Search grievances..."
                            className="pl-10 bg-white/40 border-white/40 focus:bg-white/60"
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-4">
            </div>
        </header>
    )
}

export { GlassTopbar }
