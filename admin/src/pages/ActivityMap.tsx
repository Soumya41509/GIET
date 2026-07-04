import { useState, useEffect, useMemo } from 'react'
import { GlassCard, GlassCardContent } from '../components/ui/GlassCard'
import { supabase } from '../lib/supabase'
import { subMonths, format } from 'date-fns'
import { PageTransition, StaggerItem } from '../components/ui/PageTransition'

// DEPARTMENTS are now fetched dynamically from the database

const ActivityMap = () => {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any[]>([])

    // Last 6 months
    const lastMonths = useMemo(() => {
        const months = []
        for (let i = 5; i >= 0; i--) {
            months.push(subMonths(new Date(), i))
        }
        return months
    }, [])

    useEffect(() => {
        fetchHeatmapData()
    }, [])

    const fetchHeatmapData = async () => {
        try {
            setLoading(true)

            // Fetch dynamically defined categories first
            const { data: categories, error: catError } = await supabase
                .from('categories')
                .select('name')
                .eq('is_active', true)
                .order('name')

            if (catError) throw catError
            const departmentNames = categories?.map(c => c.name) || []

            const { data: grievances, error } = await supabase
                .from('grievances')
                .select('created_at, category')

            if (error) throw error

            const matrix: any[] = departmentNames.map(dept => {
                const row: any = { department: dept }
                lastMonths.forEach(month => {
                    const monthKey = format(month, 'MMM yyyy')
                    row[monthKey] = 0
                })

                grievances?.forEach(g => {
                    // Match category to department (simplified for heatmap)
                    if (g.category === dept) {
                        const mKey = format(new Date(g.created_at), 'MMM yyyy')
                        if (row[mKey] !== undefined) {
                            row[mKey]++
                        }
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
        <PageTransition className="h-[calc(100vh-60px)] 2xl:h-[calc(100vh-80px)] flex flex-col overflow-hidden -mt-4">
            <StaggerItem className="flex-1 min-h-0">
                <GlassCard className="h-full border-none bg-white/40 shadow-2xl flex flex-col overflow-hidden">
                    <div className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                                Grievance Intensity Matrix
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Departmental Volume Analysis</p>
                        </div>

                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/60 p-4 rounded-2xl border border-white/40 shadow-sm backdrop-blur-xl">
                            <span>Low</span>
                            <div className="flex gap-1.5">
                                <div className="w-4 h-4 rounded-md bg-slate-100" />
                                <div className="w-4 h-4 rounded-md bg-teal-100" />
                                <div className="w-4 h-4 rounded-md bg-teal-200" />
                                <div className="w-4 h-4 rounded-md bg-teal-400" />
                                <div className="w-4 h-4 rounded-md bg-teal-600" />
                            </div>
                            <span className="text-teal-600">High</span>
                        </div>
                    </div>

                    <GlassCardContent className="px-8 pb-8 pt-1 flex-1 min-h-0 flex flex-col overflow-hidden">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">Analyzing Data...</div>
                        ) : (
                            <div className="flex-1 flex flex-col min-h-0 bg-white/20 rounded-3xl border border-white/40 overflow-hidden shadow-inner">
                                {/* Header Section */}
                                <div className="flex-none flex bg-white/80 backdrop-blur-md border-b border-slate-200/50">
                                    <div className="w-48 3xl:w-64 flex-none p-5 text-[10px] font-black text-slate-400 bg-white/40 uppercase tracking-widest border-r border-slate-200/50 flex items-center">
                                        Department
                                    </div>
                                    <div className="flex-1 flex overflow-hidden scrollbar-hide">
                                        {lastMonths.map(m => (
                                            <div key={m.getTime()} className="flex-1 min-w-[120px] p-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100/50 last:border-0">
                                                {format(m, 'MMM')}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Scrollable Body */}
                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    {data.map((row, rIdx) => (
                                        <div key={rIdx} className="flex border-b border-slate-100 last:border-0 group hover:bg-white/40 transition-colors">
                                            <div className="w-48 3xl:w-64 flex-none p-5 text-xs font-black text-slate-700 bg-white/60 uppercase tracking-tight border-r border-slate-200/50 sticky left-0 z-10 backdrop-blur-md">
                                                {row.department}
                                            </div>
                                            <div className="flex-1 flex">
                                                {lastMonths.map(m => {
                                                    const val = row[format(m, 'MMM yyyy')] || 0
                                                    return (
                                                        <div key={m.getTime()} className="flex-1 min-w-[120px] p-2 flex items-center justify-center border-r border-slate-100 last:border-0">
                                                            <div className={`h-11 w-full rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-300 border border-white/30 shadow-sm group-hover:scale-[0.98] ${getIntensity(val)}`}>
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
                        )}
                    </GlassCardContent>
                </GlassCard>
            </StaggerItem>
        </PageTransition>
    )
}

export default ActivityMap