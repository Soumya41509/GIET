import { useState, useEffect } from 'react'
import { Trophy, Award, Search, ArrowUpRight } from 'lucide-react'
import { GlassCard, GlassCardContent } from '../components/ui/GlassCard'
import { supabase } from '../lib/supabase'
// grievanceCategories import removed - fetching dynamically
import { ReportsSkeleton } from '../components/ui/SkeletonLoader'
import { PageTransition, StaggerItem } from '../components/ui/PageTransition'
import { GlassInput } from '../components/ui/GlassInput'

const Leaderboard = () => {
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [deptData, setDeptData] = useState<any[]>([])

    useEffect(() => {
        fetchLeaderboardData()
    }, [])

    const fetchLeaderboardData = async () => {
        try {
            setLoading(true)
            const { data: grievances, error } = await supabase
                .from('grievances')
                .select('category, status, created_at, updated_at')

            if (error) throw error
            if (grievances) {
                // Fetch dynamically defined categories
                const { data: catData } = await supabase
                    .from('categories')
                    .select('name')
                    .eq('is_active', true)
                    .order('name')
                const departments = catData?.map(c => c.name) || []

                const processed = departments.map(name => {
                    const deptGrievances = grievances.filter(g => g.category === name)
                    const total = deptGrievances.length
                    const resolved = deptGrievances.filter(g => g.status === 'Resolved').length
                    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0

                    const resolvedWithDates = deptGrievances.filter(g => g.status === 'Resolved' && g.updated_at && g.created_at)
                    const avgTime = resolvedWithDates.length > 0
                        ? resolvedWithDates.reduce((acc, g) => acc + (new Date(g.updated_at).getTime() - new Date(g.created_at).getTime()), 0) / resolvedWithDates.length / (1000 * 60 * 60)
                        : 0

                    return {
                        name,
                        total,
                        resolved,
                        rate,
                        avgTime: Math.round(avgTime),
                        pending: total - resolved
                    }
                }).sort((a, b) => b.rate - a.rate)
                setDeptData(processed)
            }
        } catch (error) {
            console.error('Error fetching leaderboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredData = deptData.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))

    if (loading) return <ReportsSkeleton />

    return (
        <PageTransition className="h-[calc(100vh-120px)] flex flex-col gap-6 overflow-hidden">
            {/* Header Area */}
            <StaggerItem>
                <div className="flex items-end justify-between px-2">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Trophy className="h-8 w-8 text-amber-500" />
                            Departmental Rankings
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Resolution Efficiency</p>
                    </div>
                    <div className="relative w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <GlassInput
                            placeholder="Find department..."
                            className="pl-10 h-10 bg-white/40 border-slate-200 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </StaggerItem>

            {/* Top 3 Spotlight */}
            <StaggerItem>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {deptData.slice(0, 3).map((dept, i) => (
                        <GlassCard key={i} className="border-white/60 bg-white/40 shadow-xl relative group hover:bg-white/60 transition-all duration-500 overflow-hidden">
                            <div className={`absolute -right-2 -top-2 font-black italic text-4xl opacity-5 group-hover:opacity-10 transition-all ${i === 0 ? 'text-amber-500' : 'text-slate-500'}`}>0{i + 1}</div>
                            <GlassCardContent className="p-4">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Award className={`h-2.5 w-2.5 ${i === 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                                        Department Rank
                                    </span>
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight truncate pr-8 uppercase">{dept.name}</h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div>
                                            <p className="text-xl font-black text-slate-900">{dept.rate}%</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Resolution</p>
                                        </div>
                                        <div className="w-[1px] h-6 bg-slate-200" />
                                        <div>
                                            <p className="text-xl font-black text-slate-900">~{dept.avgTime}h</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Resp. Time</p>
                                        </div>
                                    </div>
                                </div>
                            </GlassCardContent>
                        </GlassCard>
                    ))}
                </div>
            </StaggerItem>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0">
                <StaggerItem className="h-full">
                    <GlassCard className="h-full border-white/60 bg-white/60 shadow-2xl overflow-hidden rounded-[2rem]">
                        <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-separate border-spacing-0">
                                    <thead className="sticky top-0 z-20 bg-white/90 backdrop-blur-md shadow-sm">
                                        <tr>
                                            <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest ring-1 ring-black/5">Rank</th>
                                            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest ring-1 ring-black/5">Department</th>
                                            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center ring-1 ring-black/5">Efficiency</th>
                                            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center ring-1 ring-black/5">Volume</th>
                                            <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right ring-1 ring-black/5">Resolution</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredData.map((dept, i) => (
                                            <tr key={i} className="hover:bg-white/40 transition-all group">
                                                <td className="py-5 px-8">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${i < 3 ? 'bg-amber-100 text-amber-600 shadow-sm' : 'bg-slate-50 text-slate-400'}`}>
                                                        {i + 1}
                                                    </div>
                                                </td>
                                                <td className="py-5 px-4">
                                                    <span className="font-bold text-slate-700 tracking-tight text-base group-hover:text-amber-600 transition-colors uppercase">{dept.name}</span>
                                                </td>
                                                <td className="py-5 px-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${dept.rate}%` }} />
                                                        </div>
                                                        <span className="font-black text-slate-900 text-xs w-8">{dept.rate}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-4 text-center font-bold text-slate-500 text-sm">{dept.total} cases</td>
                                                <td className="py-5 px-8 text-right">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg group-hover:bg-amber-50 transition-colors">
                                                        <span className="text-xs font-black text-slate-600 group-hover:text-amber-600">{dept.resolved}</span>
                                                        <ArrowUpRight className="h-3 w-3 text-slate-300 group-hover:text-amber-400" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </GlassCard>
                </StaggerItem>
            </div>
        </PageTransition>
    )
}

export default Leaderboard