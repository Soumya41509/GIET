
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, FilePlus, Hourglass, CheckCircle2, Ban, UserX, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '../components/ui/GlassCard'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { DashboardSkeleton } from '../components/ui/SkeletonLoader'
import { PageTransition, StaggerItem } from '../components/ui/PageTransition'

// --- In-Memory Global Cache ---
const dashboardCache = {
    grievancesData: [] as any[],
    pieData: [] as any[],
    isWarmedUp: false
}

const Dashboard = () => {
    const navigate = useNavigate()

    const [stats, setStats] = useState([
        { label: 'Submitted', value: '0', icon: FilePlus, color: 'text-orange-600', bg: 'bg-white/80', shadowColor: 'hover:shadow-orange-500/30', cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100/50', cardBorder: 'border-orange-200/60' },
        { label: 'In Progress', value: '0', icon: Hourglass, color: 'text-amber-600', bg: 'bg-white/80', shadowColor: 'hover:shadow-amber-500/30', cardBg: 'bg-gradient-to-br from-amber-50 to-amber-100/50', cardBorder: 'border-amber-200/60' },
        { label: 'Resolved', value: '0', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-white/80', shadowColor: 'hover:shadow-green-500/30', cardBg: 'bg-gradient-to-br from-green-50 to-emerald-100/50', cardBorder: 'border-green-200/60' },
        { label: 'Rejected', value: '0', icon: Ban, color: 'text-red-600', bg: 'bg-white/80', shadowColor: 'hover:shadow-red-500/30', cardBg: 'bg-gradient-to-br from-red-50 to-red-100/50', cardBorder: 'border-red-200/60' },
        { label: 'Total', value: '0', icon: LayoutGrid, color: 'text-teal-600', bg: 'bg-white/80', shadowColor: 'hover:shadow-teal-500/30', cardBg: 'bg-gradient-to-br from-teal-50 to-teal-100/50', cardBorder: 'border-teal-200/60' },
        { label: 'Unresponsive', value: '0', icon: UserX, color: 'text-orange-500', bg: 'bg-white/80', shadowColor: 'hover:shadow-orange-500/30', cardBg: 'bg-gradient-to-br from-orange-50 to-amber-50/50', cardBorder: 'border-orange-300/60' },
    ])
    const [grievancesData, setGrievancesData] = useState<any[]>(dashboardCache.grievancesData)
    const [pieData, setPieData] = useState<any[]>(dashboardCache.pieData)
    const [loading, setLoading] = useState(!dashboardCache.isWarmedUp)
    const [chartReady, setChartReady] = useState(dashboardCache.isWarmedUp)

    // Month navigation state — default to current month
    const now = new Date()
    const [selectedMonth, setSelectedMonth] = useState({ year: now.getFullYear(), month: now.getMonth() })

    // Day-by-day data for the selected month (computed from already-fetched data)
    const monthlyTrendData = useMemo(() => {
        const { year, month } = selectedMonth
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const dayMap: { [day: number]: number } = {}

        grievancesData.forEach(g => {
            const d = new Date(g.created_at)
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate()
                dayMap[day] = (dayMap[day] || 0) + 1
            }
        })

        return Array.from({ length: daysInMonth }, (_, i) => ({
            name: String(i + 1),
            uv: dayMap[i + 1] || 0,
        }))
    }, [grievancesData, selectedMonth])

    const goToPrevMonth = () => {
        setSelectedMonth(prev => {
            const d = new Date(prev.year, prev.month - 1)
            return { year: d.getFullYear(), month: d.getMonth() }
        })
    }

    const goToNextMonth = () => {
        setSelectedMonth(prev => {
            const d = new Date(prev.year, prev.month + 1)
            return { year: d.getFullYear(), month: d.getMonth() }
        })
    }

    const isCurrentMonth = selectedMonth.year === now.getFullYear() && selectedMonth.month === now.getMonth()
    // Limit: can't go back more than 12 months from today
    const oldestAllowed = new Date(now.getFullYear(), now.getMonth() - 12)
    const isOldestMonth = selectedMonth.year === oldestAllowed.getFullYear() && selectedMonth.month === oldestAllowed.getMonth()
    const selectedMonthLabel = new Date(selectedMonth.year, selectedMonth.month).toLocaleString('default', { month: 'long', year: 'numeric' })


    // Use ref to prevent race conditions with debounced updates
    const fetchTimeoutRef = useRef<number | null>(null)
    const isMountedRef = useRef(true)

    // Debounced fetch function to prevent rapid successive calls
    const debouncedFetch = useCallback((isSilent = false) => {
        // Clear any pending fetch
        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current)
        }

        // Set new debounced fetch with 300ms delay
        fetchTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
                fetchDashboardData(isSilent)
            }
        }, 300)
    }, [])

    useEffect(() => {
        isMountedRef.current = true
        fetchDashboardData()

        const subscription = supabase
            .channel('dashboard_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'grievances' }, () => {
                // Use debounced fetch for real-time updates to prevent rapid successive calls
                debouncedFetch(true)
            })
            .subscribe()

        return () => {
            isMountedRef.current = false
            subscription.unsubscribe()
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current)
            }
        }
    }, [debouncedFetch])

    // Remove artificial delay - set chart ready immediately when data loads
    useEffect(() => {
        setChartReady(!loading)
    }, [loading])

    // Memoize status counts to prevent excessive recalculations
    const statusCounts = useMemo(() => {
        return {
            total: grievancesData.length,
            submitted: grievancesData.filter(g => g.status === 'Submitted').length,
            // Handle both "In Progress" and "In-progress" (normalize)
            inProgress: grievancesData.filter(g => g.status === 'In Progress' || g.status === 'In-progress').length,
            resolved: grievancesData.filter(g => g.status === 'Resolved').length,
            rejected: grievancesData.filter(g => g.status === 'Rejected').length,
            unresponsive: grievancesData.filter(g => g.status === 'Unresponsive').length,
        }
    }, [grievancesData])

    // Update stats when counts change
    useEffect(() => {
        setStats(prev => {
            return [
                { ...prev[0], value: statusCounts.submitted.toString() },
                { ...prev[1], value: statusCounts.inProgress.toString() },
                { ...prev[2], value: statusCounts.resolved.toString() },
                { ...prev[3], value: statusCounts.rejected.toString() },
                { ...prev[4], value: statusCounts.total.toString() },
                { ...prev[5], value: (statusCounts as any).unresponsive.toString() },
            ]
        })
    }, [statusCounts])

    const fetchDashboardData = async (isSilent = false) => {
        try {
            if (!isSilent && !dashboardCache.isWarmedUp) setLoading(true)

            // Fetch ALL grievances in batches (PostgREST has server-side 1000 row limit)
            let grievances: any[] = []
            let from = 0
            const batchSize = 1000
            let hasMore = true

            while (hasMore) {
                const { data: batch, error } = await supabase
                    .from('grievances')
                    .select('*')
                    .range(from, from + batchSize - 1)

                if (error) throw error

                if (batch && batch.length > 0) {
                    grievances = [...grievances, ...batch]
                    from += batchSize

                    // If we got less than batchSize, we've reached the end
                    if (batch.length < batchSize) {
                        hasMore = false
                    }
                } else {
                    hasMore = false
                }
            }

            console.log('📊 Total grievances fetched in batches:', grievances.length)

            if (grievances && isMountedRef.current) {
                // Store raw data for memoized calculations
                setGrievancesData(grievances)
                dashboardCache.grievancesData = grievances

                // Calculate Pie Data
                const statusBreakdown = {
                    resolved: grievances.filter(g => g.status === 'Resolved').length,
                    submitted: grievances.filter(g => g.status === 'Submitted').length,
                    inProgress: grievances.filter(g => g.status === 'In Progress' || g.status === 'In-progress').length,
                    rejected: grievances.filter(g => g.status === 'Rejected').length,
                }

                const newPieData = [
                    { name: 'Resolved', value: statusBreakdown.resolved, color: '#10b981' }, // emerald
                    { name: 'Submitted', value: statusBreakdown.submitted, color: '#3b82f6' }, // blue
                    { name: 'In Progress', value: statusBreakdown.inProgress, color: '#eab308' }, // yellow
                    { name: 'Rejected', value: statusBreakdown.rejected, color: '#ef4444' }, // red
                    { name: 'Unresponsive', value: grievances.filter(g => g.status === 'Unresponsive').length, color: '#f97316' }, // orange
                ]
                setPieData(newPieData)
                dashboardCache.pieData = newPieData
                dashboardCache.isWarmedUp = true

                // monthlyTrendData is computed via useMemo — no extra work needed here
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageTransition className="space-y-6">
            {loading ? (
                <DashboardSkeleton />
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 3xl:gap-8">
                        {stats.map((stat, i) => (
                            <StaggerItem
                                key={stat.label}
                                delay={i * 0.04}
                                className={i >= 4 ? "lg:col-span-2" : ""}
                            >
                                {i < 4 ? (
                                    <GlassCard
                                        className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl outline-none ${stat.shadowColor} ${stat.cardBg} ${stat.cardBorder}`}
                                        onClick={() => navigate(stat.label === 'Total' ? '/grievances' : `/grievances?status=${stat.label}`)}
                                    >
                                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/40 blur-2xl transition-all duration-500 group-hover:bg-white/60" />
                                        <GlassCardContent className="relative p-7 3xl:p-10 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs 3xl:text-sm font-semibold text-slate-600 tracking-widest uppercase whitespace-nowrap">{stat.label}</p>
                                                <p className="text-4xl 3xl:text-6xl font-bold text-slate-800 mt-2 tracking-tight">{stat.value}</p>
                                            </div>
                                            <div className={`p-4 3xl:p-5 rounded-2xl shadow-sm ring-1 ring-black/5 ${stat.bg} ${stat.color} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                                                <stat.icon className="h-8 w-8 3xl:h-10 3xl:w-10" strokeWidth={1.5} />
                                            </div>
                                        </GlassCardContent>
                                    </GlassCard>
                                ) : (
                                    <div
                                        className={`group relative flex items-center justify-between py-3.5 px-8 rounded-full border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer overflow-hidden ${stat.cardBg} ${stat.cardBorder}`}
                                        onClick={() => navigate(stat.label === 'Total' ? '/grievances' : `/grievances?status=${stat.label}`)}
                                    >
                                        {/* Glossy Overlay Shine */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

                                        {/* Left: Number */}
                                        <div className="relative z-10">
                                            <span className="text-3xl 3xl:text-5xl font-black text-slate-800 tracking-tighter leading-none">
                                                {stat.value}
                                            </span>
                                        </div>

                                        {/* Right: Logo then Label */}
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className={`p-2 rounded-full shadow-inner ring-1 ring-black/5 bg-white transition-transform duration-500 group-hover:scale-110 ${stat.color}`}>
                                                <stat.icon className="h-5 w-5" strokeWidth={2.5} />
                                            </div>
                                            <span className="text-[11px] 3xl:text-sm font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                                {stat.label === 'Total' ? 'Total Grievances' : 'Unresponsive'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </StaggerItem>
                        ))}
                    </div>

                    <StaggerItem delay={0.45}>
                        <div className="grid gap-4 3xl:gap-8 md:grid-cols-7">
                            <GlassCard className="md:col-span-4 shadow-xl shadow-cyan-900/5 border-white/60 bg-white/40 backdrop-blur-xl">
                                <GlassCardHeader>
                                    <div className="flex items-center justify-between w-full">
                                        <GlassCardTitle className="3xl:text-2xl text-slate-800">Grievance Trends</GlassCardTitle>
                                        {/* Month navigation */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={goToPrevMonth}
                                                disabled={isOldestMonth}
                                                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Previous month"
                                            >
                                                <ChevronLeft className="h-4 w-4 text-slate-500" />
                                            </button>
                                            <span className="text-sm font-semibold text-slate-700 min-w-[130px] text-center">
                                                {selectedMonthLabel}
                                            </span>
                                            <button
                                                onClick={goToNextMonth}
                                                disabled={isCurrentMonth}
                                                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Next month"
                                            >
                                                <ChevronRight className="h-4 w-4 text-slate-500" />
                                            </button>
                                        </div>
                                    </div>
                                </GlassCardHeader>
                                <GlassCardContent>
                                    <div className="h-[420px] 2xl:h-[520px] 3xl:h-[680px] w-full">
                                        {chartReady && monthlyTrendData.every(d => d.uv === 0) ? (
                                            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                                                <svg className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 40 L12 28 L20 32 L28 18 L36 24 L44 10" />
                                                    <rect x="2" y="2" width="44" height="44" rx="4" strokeDasharray="4 4" />
                                                </svg>
                                                <p className="text-sm font-medium">No grievances in {selectedMonthLabel}</p>
                                                <p className="text-xs opacity-70">Use arrows to navigate to another month</p>
                                            </div>
                                        ) : chartReady && (
                                            <ResponsiveContainer width="100%" height="100%" debounce={1}>
                                                <AreaChart data={monthlyTrendData}>
                                                    <defs>
                                                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                                        dy={10}
                                                        ticks={(() => {
                                                            const total = monthlyTrendData.length // exact days in selected month
                                                            const marks = [1, 5, 10, 15, 20, 25].filter(d => d <= total)
                                                            if (!marks.includes(total)) marks.push(total)
                                                            return marks.map(String)
                                                        })()}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                                        dx={-10}
                                                        allowDecimals={false}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                            borderRadius: '16px',
                                                            border: '1px solid rgba(255,255,255,0.5)',
                                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                            padding: '12px'
                                                        }}
                                                        itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                                                        formatter={(value: any) => [value, 'Grievances']}
                                                        labelFormatter={(label) => `Day ${label}`}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="uv"
                                                        stroke="#3b82f6"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorUv)"
                                                        isAnimationActive={true}
                                                        animationDuration={600}
                                                        animationBegin={0}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        )}
                                        {!chartReady && null}
                                    </div>
                                </GlassCardContent>
                            </GlassCard>

                            <GlassCard className="md:col-span-3 shadow-xl shadow-cyan-900/5 border-white/60 bg-white/40 backdrop-blur-xl flex flex-col">
                                <GlassCardHeader>
                                    <GlassCardTitle className="3xl:text-2xl text-slate-800">Status Distribution</GlassCardTitle>
                                </GlassCardHeader>
                                <GlassCardContent className="flex-1 flex flex-col pb-6">
                                    <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
                                        {chartReady && (
                                            <ResponsiveContainer width="100%" height="100%" debounce={1}>
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius="65%"
                                                        outerRadius="85%"
                                                        paddingAngle={0}
                                                        cornerRadius={4}
                                                        dataKey="value"
                                                        stroke="#ffffff"
                                                        strokeWidth={4}
                                                        strokeLinejoin="round"
                                                        isAnimationActive={true}
                                                        animationDuration={800}
                                                        animationBegin={0}
                                                    >
                                                        {pieData.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={entry.color}
                                                                className="transition-all hover:opacity-80"
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                                                        <tspan x="50%" dy="-8" className="fill-slate-800 font-extrabold" fontSize="48">
                                                            {stats[4].value}
                                                        </tspan>
                                                        <tspan x="50%" dy="32" className="fill-slate-500 font-semibold uppercase tracking-wider" fontSize="14">
                                                            Total Grievances
                                                        </tspan>
                                                    </text>
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-3 mt-6 2xl:mt-8 px-4 flex-none">
                                        {pieData.map((entry) => (
                                            <div key={entry.name} className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/50 border border-slate-200/60 shadow-sm text-xs 2xl:text-base font-bold text-slate-700 transition-all hover:bg-white hover:shadow-md cursor-default">
                                                <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: entry.color }} />
                                                <span>{entry.name}</span>
                                                <span className="text-slate-400 font-black ml-1">{entry.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCardContent>
                            </GlassCard>
                        </div>
                    </StaggerItem>
                </>
            )}
        </PageTransition>
    )
}

export default Dashboard
