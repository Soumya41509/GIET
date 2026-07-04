import { useEffect, useState } from 'react'
import { MonitorX } from 'lucide-react'
import { GlassCard, GlassCardContent } from '../ui/GlassCard'

const DeviceRestriction = ({ children }: { children: React.ReactNode }) => {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkDevice = () => {
            // Check if width is less than 1024px (typical tablet landscape/laptop cutoff)
            setIsMobile(window.innerWidth < 1024)
        }

        checkDevice()
        window.addEventListener('resize', checkDevice)

        return () => window.removeEventListener('resize', checkDevice)
    }, [])

    if (isMobile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <GlassCard className="max-w-md w-full text-center">
                    <GlassCardContent className="pt-6">
                        <div className="mb-4 flex justify-center">
                            <div className="p-4 rounded-full bg-red-100 text-red-600">
                                <MonitorX className="h-12 w-12" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Desktop Access Only</h2>
                        <p className="text-slate-600 mb-6">
                            The GIET Admin Panel is optimized for desktop and laptop devices. Please access this application from a larger screen for the best experience.
                        </p>
                    </GlassCardContent>
                </GlassCard>
            </div>
        )
    }

    return <>{children}</>
}

export default DeviceRestriction
