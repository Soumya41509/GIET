import { useState, useEffect, useMemo } from 'react'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '../ui/GlassCard'
import { supabase } from '../../lib/supabase'
import { subMonths, format } from 'date-fns'

const Heatmap = () => {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any[]>([])

    const lastMonths = useMemo(() => {
        const months = []
        for (let i = 5; i >= 0; i--) {
            months.push(subMonths(new Date(), i))
        }
        return months
    }, [])

    useEffect(() => {
        const fetchHeatmapData = async () => {
            try {
                setLoading(true)
                const { data: categories } = await supabase
                    .from('categories')
                    .select('name')
                    .eq('is_active', true)
                    .order('name')

                const departmentNames = categories?.map(c => c.name) || []

                const { data: grievances } = await supabase
                    .from('grievances')
                    .select('created_at, category')

                const matrix = departmentNames.map(dept => {
                    const row: any = { department: dept }
                    lastMonths.forEach(month => {
                        const monthKey = format(month, 'MMM yyyy')
                        row[monthKey] = 0
                    })

                    grievances?.forEach(g => {
                        if (g.category === dept) {
                            const mKey = format(new Date(g.created_at), 'MMM yyyy')
                            if (row[mKey] !== undefined) row[mKey]++
                        }
                    })
                    return row
                })

                setData(matrix)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchHeatmapData()
    }, [lastMonths])

    const maxCount = useMemo(() => {
        let max = 1
        data.forEach(row => {
            lastMonths.forEach(month => {
                const val = row[format(month, 'MMM yyyy')] || 0
                if (val > max) max = val
            })
        })
        return max
    }, [data, lastMonths])

    const getIntensity = (val: number) => {
        if (!val) return 'bg-slate-100/40'
        const ratio = val / maxCount
        if (ratio > 0.8) return 'bg-teal-600 text-white'
        if (ratio > 0.5) return 'bg-teal-400 text-white'
        if (ratio > 0.2) return 'bg-teal-200 text-teal-900'
        return 'bg-teal-100 text-teal-800'
    }

    return (
        <GlassCard className="flex flex-col h-[calc(100vh-48px)] 2xl:h-[calc(100vh-80px)] 3xl:h-[calc(100vh-96px)] overflow-hidden border-white/60 bg-white/40 backdrop-blur-xl shadow-xl shadow-cyan-900/5">
            <GlassCardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 flex-none">
                <div>
                    <GlassCardTitle className="text-lg md:text-xl font-bold">Grievance Intensity Matrix</GlassCardTitle>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Departmental Volume Analysis</p>
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <span>Low</span>
                    <div className="flex gap-0.5 md:gap-1">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-slate-100" />
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-teal-100" />
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-teal-200" />
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-teal-400" />
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-teal-600" />
                    </div>
                    <span>High</span>
                </div>
            </GlassCardHeader>
            <GlassCardContent className="p-2 md:p-4 pt-0 md:pt-4 flex-1 flex flex-col min-h-0">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">Analyzing Data...</div>
                ) : (
                    <div className="flex-1 flex flex-col rounded-xl md:rounded-2xl border border-slate-200/50 overflow-hidden bg-white/20 min-h-0">
                        {/* Table Wrapper for Horizontal Scroll */}
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <div className="inline-block min-w-full align-middle">
                                {/* Header */}
                                <div className="flex sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
                                    <div className="w-28 md:w-48 flex-none p-3 md:p-4 text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200/50 sticky left-0 bg-white/80 z-30">
                                        Dept
                                    </div>
                                    <div className="flex flex-1">
                                        {lastMonths.map(m => (
                                            <div key={m.getTime()} className="min-w-[60px] md:min-w-[80px] flex-1 p-3 md:p-4 text-center text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100/50 last:border-0">
                                                {format(m, 'MMM')}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Rows */}
                                <div className="divide-y divide-slate-100">
                                    {data.map((row, rIdx) => (
                                        <div key={rIdx} className="flex hover:bg-white/40 transition-colors group">
                                            <div className="w-28 md:w-48 flex-none p-3 md:p-4 text-[9px] md:text-[10px] font-bold text-slate-700 bg-white/40 border-r border-slate-200/50 sticky left-0 z-10 backdrop-blur-md truncate group-hover:bg-white/60 transition-colors">
                                                {row.department}
                                            </div>
                                            <div className="flex flex-1">
                                                {lastMonths.map(m => {
                                                    const val = row[format(m, 'MMM yyyy')] || 0
                                                    return (
                                                        <div key={m.getTime()} className="min-w-[60px] md:min-w-[80px] flex-1 p-1 md:p-1.5 flex items-center justify-center border-r border-slate-100 last:border-0">
                                                            <div className={`h-7 md:h-8 w-full rounded-md md:rounded-lg flex items-center justify-center font-black text-[9px] md:text-[10px] transition-all border border-white/30 shadow-sm ${getIntensity(val)}`}>
                                                                {val || '-'}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </GlassCardContent>
        </GlassCard>
    )
}

export default Heatmap
