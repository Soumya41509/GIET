import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, BarChart3, LogOut, Users, MessageSquare, ChevronDown, Settings, TrendingUp, ShieldCheck, Megaphone, HelpCircle, Lightbulb, Grid } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { GlassModal } from '../ui/GlassModal'
import { GlassButton } from '../ui/GlassButton'
import { motion, AnimatePresence } from 'framer-motion'
import gietLogo from '../../assets/giet-logo.png'

const GlassSidebar = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout, role } = useAuth()
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => ({
        reports: location.pathname.startsWith('/reports'),
        management: location.pathname.startsWith('/management'),
    }))
    const [hoveredMenu, setHoveredMenu] = useState<string | null>(null)

    // Update open state if URL changes externally - Retract others
    useEffect(() => {
        setOpenMenus({
            reports: location.pathname.startsWith('/reports'),
            management: location.pathname.startsWith('/management'),
        })
    }, [location.pathname])

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: FileText, label: 'Grievances', path: '/grievances' },
        { icon: BarChart3, label: 'Reports', path: '/reports' },
        {
            id: 'management',
            icon: Users,
            label: 'Management',
            path: '/management',
            hasSubmenu: true,
            subItems: [
                { icon: Users, label: 'Staff Management', path: '/management/staff' },
                { icon: Grid, label: 'Classification', path: '/management/categories' },
                { icon: Settings, label: 'SLA Policy', path: '/management/departments' },
                { icon: TrendingUp, label: 'Escalation Flows', path: '/management/escalation' },
                { icon: Megaphone, label: 'Broadcasts', path: '/management/announcements' },
                { icon: Lightbulb, label: 'Home Page Tips', path: '/management/tips' },
                { icon: HelpCircle, label: 'Help Center', path: '/management/support' },
                ...(role === 'super_admin' ? [
                    { icon: ShieldCheck, label: 'Admin Security', path: '/management/admin' },
                ] : [])
            ]
        },
        { icon: MessageSquare, label: 'Feedbacks', path: '/feedback' },
    ]

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true)
    }

    const confirmLogout = async () => {
        try {
            await logout()
            navigate('/login')
        } catch (error) {
            console.error("Logout failed", error)
        }
    }

    return (
        <>
            <aside className="fixed left-0 top-0 z-40 h-screen w-64 3xl:w-80 border-r border-white/40 bg-transparent backdrop-blur-xl transition-all duration-300">
                <div className="flex h-full flex-col px-3 py-4 3xl:px-5 3xl:py-6">
                    <div
                        onClick={() => navigate('/')}
                        className="mb-8 3xl:mb-12 flex items-center pl-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <img
                            src={gietLogo}
                            alt="GIET Logo"
                            className="mr-3 h-12 w-12 3xl:h-16 3xl:w-16 object-contain"
                        />
                        <span className="self-center whitespace-nowrap text-3xl 3xl:text-5xl font-black text-teal-900 tracking-tighter">
                            GIET
                        </span>
                    </div>

                    <ul className="space-y-2 3xl:space-y-3 font-medium flex-1 overflow-y-auto no-scrollbar">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                {item.hasSubmenu ? (
                                    <div
                                        className="space-y-1"
                                        onMouseEnter={() => setHoveredMenu(item.id || null)}
                                        onMouseLeave={() => setHoveredMenu(null)}
                                    >
                                        <div
                                            className={cn(
                                                'group flex w-full items-center justify-between rounded-xl p-3 3xl:p-4 transition-all hover:bg-white/40 cursor-pointer',
                                                location.pathname.startsWith(item.path)
                                                    ? 'bg-white/40 text-teal-900 border border-teal-500/10'
                                                    : 'text-slate-700 hover:text-teal-900'
                                            )}
                                            onClick={() => navigate(item.path)}
                                        >
                                            <div className="flex items-center flex-1">
                                                <item.icon className={cn("h-5 w-5 3xl:h-6 3xl:w-6 flex-shrink-0 transition duration-75")} />
                                                <span className="ml-3 3xl:text-lg tracking-wide">{item.label}</span>
                                            </div>
                                            <div className="p-1 rounded-lg">
                                                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", (openMenus[item.id || ''] || hoveredMenu === item.id) && "rotate-180")} />
                                            </div>
                                        </div>

                                        <AnimatePresence initial={false}>
                                            {(openMenus[item.id || ''] || hoveredMenu === item.id) && (
                                                <motion.ul
                                                    initial={{ height: 0, opacity: 0, y: -4 }}
                                                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                                                    exit={{ height: 0, opacity: 0, y: -4 }}
                                                    transition={{
                                                        height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                                                        opacity: { duration: 0.25, ease: 'linear' },
                                                        y: { duration: 0.3, ease: 'easeOut' }
                                                    }}
                                                    className="overflow-hidden space-y-1 ml-4 border-l-2 border-slate-100/50"
                                                >
                                                    {item.subItems?.map((sub, idx) => (
                                                        <motion.li
                                                            key={sub.path}
                                                            initial={{ x: -8, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: idx * 0.04, duration: 0.3, ease: 'easeOut' }}
                                                            className="pl-4 py-0.5"
                                                        >
                                                            <NavLink
                                                                to={sub.path}
                                                                className={({ isActive }) =>
                                                                    cn(
                                                                        'flex items-center rounded-lg p-2.5 3xl:p-3 text-sm 3xl:text-base transition-all duration-300 hover:bg-white/60 relative group-inner',
                                                                        isActive
                                                                            ? 'bg-teal-50 text-teal-700 font-bold shadow-sm ring-1 ring-teal-500/10'
                                                                            : 'text-slate-500 hover:text-teal-900'
                                                                    )
                                                                }
                                                            >
                                                                <sub.icon className="h-4 w-4 3xl:h-5 3xl:w-5 mr-3 opacity-60 group-inner-hover:opacity-100 transition-opacity" />
                                                                {sub.label}
                                                            </NavLink>
                                                        </motion.li>
                                                    ))}
                                                </motion.ul>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) =>
                                            cn(
                                                'group flex items-center rounded-xl p-3 3xl:p-4 transition-all hover:bg-white/40',
                                                isActive
                                                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-500/20'
                                                    : 'text-slate-700 hover:text-teal-900'
                                            )
                                        }
                                    >
                                        <item.icon className={cn("h-5 w-5 3xl:h-6 3xl:w-6 flex-shrink-0 transition duration-75")} />
                                        <span className="ml-3 3xl:text-lg tracking-wide">{item.label}</span>
                                    </NavLink>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-auto border-t border-white/30 pt-4 3xl:pt-6">
                        <button
                            onClick={handleLogoutClick}
                            className="flex w-full items-center rounded-xl p-3 3xl:p-4 text-slate-700 transition-all hover:bg-red-50 hover:text-red-600 hover:shadow-sm"
                        >
                            <LogOut className="h-5 w-5 3xl:h-6 3xl:w-6 flex-shrink-0" />
                            <span className="ml-3 3xl:text-lg font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            <GlassModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                title="Confirm Logout"
            >
                <div className="space-y-6">
                    <p className="text-2xl font-medium text-slate-700 leading-relaxed">
                        Are you sure you want to log out? You will need to sign in again to access the admin panel.
                    </p>
                    <div className="flex justify-end gap-3">
                        <GlassButton
                            variant="secondary"
                            onClick={() => setIsLogoutModalOpen(false)}
                        >
                            Cancel
                        </GlassButton>
                        <GlassButton
                            variant="destructive"
                            onClick={confirmLogout}
                        >
                            Log Out
                        </GlassButton>
                    </div>
                </div>
            </GlassModal>
        </>
    )
}

export { GlassSidebar }
