import { useState, useEffect, useRef } from 'react'
import { format, subDays } from 'date-fns'
import { Search, ArrowUpDown, Eye, Filter, Calendar, Clock, AlertCircle, CheckCircle, XCircle, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard, GlassCardContent, GlassCardHeader } from '../components/ui/GlassCard'
import { GlassInput } from '../components/ui/GlassInput'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassTable, GlassTableHeader, GlassTableBody, GlassTableRow, GlassTableHead, GlassTableCell } from '../components/ui/GlassTable'
import { GlassSelect } from '../components/ui/GlassSelect'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TableSkeleton } from '../components/ui/SkeletonLoader'
import type { Grievance } from '../types'
import { PageTransition, StaggerItem } from '../components/ui/PageTransition'

// --- In-Memory Query Cache ---
// Snappy SWR: Caches every single filter combination for INSTANT loads on re-visit
const memoryCache = {
    queries: {} as Record<string, { data: Grievance[], count: number }>,
    getCache: (page: number, search: string, status: string, date: string, sort: string) => {
        return memoryCache.queries[`${page}-${search}-${status}-${date}-${sort}`]
    }
}

const Grievances = () => {
    const navigate = useNavigate()
    const location = useLocation()


    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState(() => {
        const params = new URLSearchParams(window.location.search)
        const initialStatus = params.get('status')
        const validMap = ['All', 'Submitted', 'In Progress', 'Resolved', 'Rejected', 'Unresponsive', 'Reopened']
        return validMap.includes(initialStatus as string) ? (initialStatus as string) : 'All'
    })
    const [dateFilter, setDateFilter] = useState(() => {
        const params = new URLSearchParams(window.location.search)
        const initialDate = params.get('date')
        const validDates = ['All', '7', '30', '60', '90']
        return validDates.includes(initialDate as string) ? (initialDate as string) : 'All'
    })

    const initialCache = memoryCache.getCache(1, '', statusFilter, dateFilter, 'desc')

    // Data & Pagination (Initialized with cache for absolute 0-second re-renders on initial load)
    const [grievances, setGrievances] = useState<Grievance[]>(initialCache ? initialCache.data : [])
    const [loading, setLoading] = useState(!initialCache) // Skip skeleton entirely if cached
    const [isFetching, setIsFetching] = useState(false) // Background network updates
    const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'completing'>('idle')
    const [fetchCycleKey, setFetchCycleKey] = useState(0)
    const [totalCount, setTotalCount] = useState(initialCache ? initialCache.count : 0)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 50
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    const isMountedRef = useRef(true)

    // Handle URL params dynamically when they change via navigation/back button
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const statusParam = params.get('status') || 'All'
        const dateParam = params.get('date') || 'All'

        let shouldUpdatePage = false
        if (statusParam !== statusFilter) {
            setStatusFilter(statusParam)
            shouldUpdatePage = true
        }
        if (dateParam !== dateFilter) {
            setDateFilter(dateParam)
            shouldUpdatePage = true
        }
        if (shouldUpdatePage) setCurrentPage(1)
    }, [location.search])

    const updateUrlParams = (key: 'status' | 'date', value: string) => {
        const params = new URLSearchParams(location.search)
        if (value === 'All') {
            params.delete(key)
        } else {
            params.set(key, value)
        }
        navigate({ search: params.toString() }, { replace: true })
    }

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== debouncedSearch) {
                setLoading(true)
                setDebouncedSearch(searchTerm)
                setCurrentPage(1) // Reset to page 1 on search
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm, debouncedSearch])

    // Main Fetch Effect
    useEffect(() => {
        fetchGrievances()
    }, [currentPage, debouncedSearch, statusFilter, dateFilter, sortOrder])

    // Loading Bar State Orchestration
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>
        if (isFetching) {
            setFetchCycleKey(Date.now())
            setLoadingState('loading')
        } else if (loadingState === 'loading') {
            setLoadingState('completing')
            timer = setTimeout(() => {
                setLoadingState('idle')
            }, 600) // 300ms for 100% animation + 300ms fade delay
        }
        return () => clearTimeout(timer)
    }, [isFetching, loadingState])

    // Realtime Listener - Industry Grade Optimization
    // Keep a ref to the latest fetcher to avoid recreating the Websocket channel
    const fetchRef = useRef(fetchGrievances)
    useEffect(() => {
        fetchRef.current = fetchGrievances
    })

    useEffect(() => {
        isMountedRef.current = true
        let timeoutId: any

        const subscription = supabase
            .channel('grievances_list_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'grievances' }, () => {
                // Debounce real-time updates so we don't spam fetch on mass db updates
                if (timeoutId) clearTimeout(timeoutId)
                timeoutId = setTimeout(() => {
                    if (isMountedRef.current) fetchRef.current(true)
                }, 300)
            })
            .subscribe()

        return () => {
            isMountedRef.current = false
            subscription.unsubscribe()
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [])

    async function fetchGrievances(isSilent = false) {
        const cacheKey = `${currentPage}-${debouncedSearch}-${statusFilter}-${dateFilter}-${sortOrder}`
        const cachedData = memoryCache.queries[cacheKey]

        // SWR (Stale-While-Revalidate): Inject cached data instantly before network finishes
        if (cachedData) {
            setGrievances(cachedData.data)
            setTotalCount(cachedData.count)
        }

        try {
            if (!isSilent && !cachedData) {
                setLoading(true)     // Full screen skeleton loader for unknown pages
            } else if (!isSilent) {
                setIsFetching(true)  // Fast 80/20 cyber bar for cached/background refreshes
            }

            const from = (currentPage - 1) * itemsPerPage
            const to = from + itemsPerPage - 1

            let query = supabase
                .from('grievances') // Use main table to avoid filtering bugs with views
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: sortOrder === 'asc' })
                .range(from, to)

            if (statusFilter !== 'All') {
                if (statusFilter === 'In Progress') {
                    query = query.in('status', ['In Progress', 'In-progress'])
                } else {
                    query = query.eq('status', statusFilter)
                }
            }

            if (dateFilter !== 'All') {
                const days = parseInt(dateFilter)
                const dateLimit = subDays(new Date(), days).toISOString()
                query = query.gte('created_at', dateLimit)
            }

            if (debouncedSearch) {
                // NEW: Full-Text Search on 'fts' column (covers title + description)
                query = query.textSearch('fts', debouncedSearch.trim(), {
                    config: 'english',
                    type: 'plain'
                })
            }

            const { data, count, error } = await query
            if (error) throw error

            // Prevent stale responses from overwriting fresh data if multiple requests were flying
            const fetchedGrievances = data as Grievance[] || []
            setGrievances(fetchedGrievances)

            if (count !== null) setTotalCount(count)

            // Update Dynamic Query Cache
            memoryCache.queries[cacheKey] = {
                data: fetchedGrievances,
                count: count !== null ? count : 0
            }

        } finally {
            setLoading(false)
            setIsFetching(false)
        }
    }

    // Performance: Pre-calculate duplicates in O(N) to avoid O(N^2) inside render
    const duplicateTitles = new Set<string>();
    const identifiedDuplicates = new Set<string>();
    grievances.forEach(g => {
        const title = g.title?.toLowerCase().trim();
        if (title) {
            if (duplicateTitles.has(title)) {
                identifiedDuplicates.add(title);
            }
            duplicateTitles.add(title);
        }
    });

    const totalPages = Math.ceil(totalCount / itemsPerPage)

    const handleSort = () => {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
        setCurrentPage(1)
    }

    const exportAllData = async () => {
        try {
            const query = supabase.from('grievances').select('*').order('created_at', { ascending: false })
            const { data } = await query
            if (!data) return

            const headers = ['ID', 'Title', 'Category', 'Subcategory', 'Status', 'Date', 'Description']
            const csvContent = [
                headers.join(','),
                ...data.map((g: any) => [
                    g.id,
                    `"${g.title?.replace(/"/g, '""') || ''}"`,
                    g.category,
                    g.subcategory || '-',
                    g.status,
                    g.created_at ? format(new Date(g.created_at), 'dd MMM yyyy') : '-',
                    `"${g.description?.replace(/"/g, '""') || ''}"`
                ].join(','))
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `grievances_export_${format(new Date(), 'yyyy-MM-dd')}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (e) {
            console.error("Export failed", e)
        }
    }

    const statuses = [
        { id: 'All', label: 'All', icon: Filter, color: 'from-blue-500 to-indigo-600' },
        { id: 'Submitted', label: 'Submitted', icon: Clock, color: 'from-orange-500 to-amber-600' },
        { id: 'In Progress', label: 'In Progress', icon: AlertCircle, color: 'from-amber-400 to-yellow-600' },
        { id: 'Resolved', label: 'Resolved', icon: CheckCircle, color: 'from-green-500 to-emerald-600' },
        { id: 'Rejected', label: 'Rejected', icon: XCircle, color: 'from-red-500 to-rose-600' },
        { id: 'Unresponsive', label: 'Unresponsive', icon: AlertCircle, color: 'from-orange-500 to-orange-600' },
        { id: 'Reopened', label: 'Reopened', icon: Activity, color: 'from-fuchsia-500 to-pink-600' },
    ]

    return (
        <PageTransition className="flex-1 flex flex-col min-h-0 gap-6 lg:gap-8 h-[calc(100vh-3rem)] 2xl:h-[calc(100vh-5rem)] 3xl:h-[calc(100vh-6rem)]">
            {/* Header Cluster */}
            <StaggerItem className="flex-none">
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-teal-900">Grievance Central</h1>
                        <p className="text-slate-500 text-sm">
                            Track, filter & resolve grievances in real time.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-56 h-[52px]">
                            <GlassSelect
                                value={dateFilter}
                                onChange={(val) => {
                                    if (val !== dateFilter) {
                                        setDateFilter(val)
                                        setCurrentPage(1)
                                        updateUrlParams('date', val)
                                    }
                                }}
                                icon={Calendar}
                                options={[
                                    { value: 'All', label: 'All Time Range' },
                                    { value: '7', label: 'Last 7 Days' },
                                    { value: '30', label: 'Last 30 Days' },
                                    { value: '60', label: 'Last 60 Days' },
                                    { value: '90', label: 'Last 90 Days' },
                                ]}
                                className="h-full bg-white hover:bg-slate-50 border-slate-200 text-slate-900 rounded-2xl shadow-sm"
                            />
                        </div>

                        <GlassButton
                            variant="outline"
                            onClick={handleSort}
                            className="w-[160px] justify-center rounded-2xl px-6 py-6 border-slate-200 hover:border-teal-500/30 hover:bg-teal-50/30 font-bold"
                        >
                            <ArrowUpDown className="mr-2 h-4 w-4 shrink-0 text-teal-600" />
                            {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
                        </GlassButton>

                        <GlassButton
                            variant="primary"
                            onClick={exportAllData}
                            className="rounded-2xl px-8 py-6 bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-900/10 font-bold"
                        >
                            Export to CSV
                        </GlassButton>
                    </div>
                </div>
            </StaggerItem>

            <StaggerItem className="flex-1 flex flex-col min-h-0">
                <GlassCard className="flex-1 flex flex-col min-h-0 overflow-hidden shadow-2xl shadow-cyan-900/5 border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl">
                    <GlassCardHeader className="flex-none pb-6 3xl:pb-8 border-b border-white/20">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="relative w-full lg:w-96 3xl:w-[32rem]">
                                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                <GlassInput
                                    placeholder="Search grievances by title..."
                                    className="pl-12 py-4 3xl:text-lg bg-white/60 border-white/40 focus:bg-white/90 transition-all rounded-[1.25rem] shadow-sm ring-teal-500/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="relative flex bg-white/40 p-1.5 rounded-[1.25rem] border border-white/60 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-x-auto scrollbar-hide">
                                {statuses.map((status) => {
                                    const Icon = status.icon
                                    const isActive = statusFilter === status.id
                                    return (
                                        <button
                                            key={status.id}
                                            onClick={() => {
                                                if (statusFilter !== status.id) {
                                                    setStatusFilter(status.id)
                                                    setCurrentPage(1)
                                                    updateUrlParams('status', status.id)
                                                }
                                            }}
                                            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 z-10 whitespace-nowrap
                                            ${isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                        >
                                            <Icon className={`h-3.5 w-3.5 transition-transform duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-400'}`} />
                                            {status.label}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="grievance-status-highlight"
                                                    className={`absolute inset-0 bg-gradient-to-r ${status.color} rounded-lg -z-10 shadow-md`}
                                                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                                                />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </GlassCardHeader>

                    <GlassCardContent className="flex-1 flex flex-col min-h-0 overflow-hidden p-0 relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="flex-1 flex flex-col min-h-0 w-full relative"
                        >
                            {/* Seamless Premium Loading Bar */}
                            {loadingState !== 'idle' && !loading && (
                                <motion.div
                                    key={`bar-container-${fetchCycleKey}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: loadingState === 'completing' ? 0 : 1 }}
                                    transition={{ duration: 0.3, delay: loadingState === 'completing' ? 0.3 : 0 }}
                                    className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden rounded-t-3xl bg-teal-500/10"
                                >
                                    <motion.div
                                        key={`bar-progress-${fetchCycleKey}`}
                                        initial={{ width: "0%" }}
                                        animate={{ width: loadingState === 'completing' ? "100%" : "80%" }}
                                        transition={{
                                            duration: loadingState === 'completing' ? 0.3 : 2,
                                            ease: "easeOut"
                                        }}
                                        className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.5)]"
                                    />
                                </motion.div>
                            )}

                            {loading ? (
                                <div className="p-8">
                                    <TableSkeleton />
                                </div>
                            ) : (
                                <>
                                    <GlassTable containerClassName={`flex-1 h-full min-h-0 transition-opacity duration-300 ${isFetching ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                                        <GlassTableHeader className="bg-white/80 border-b border-white/20 sticky top-0 z-10 backdrop-blur-xl">
                                            <GlassTableRow className="border-none hover:bg-transparent">
                                                <GlassTableHead className="w-[120px] pl-10 text-slate-800 font-black uppercase text-[10px] tracking-widest py-6">ID</GlassTableHead>
                                                <GlassTableHead className="text-slate-800 font-black uppercase text-[10px] tracking-widest py-6">Complaint Detail</GlassTableHead>
                                                <GlassTableHead className="text-slate-800 font-black uppercase text-[10px] tracking-widest py-6">Category</GlassTableHead>
                                                <GlassTableHead className="text-slate-800 font-black uppercase text-[10px] tracking-widest py-6">Classification</GlassTableHead>
                                                <GlassTableHead className="text-slate-800 font-black uppercase text-[10px] tracking-widest py-6">Date Received</GlassTableHead>
                                                <GlassTableHead className="text-right text-slate-800 font-black uppercase text-[10px] tracking-widest py-6 pr-10">Action</GlassTableHead>
                                            </GlassTableRow>
                                        </GlassTableHeader>
                                        <GlassTableBody>
                                            <AnimatePresence mode="popLayout">
                                                {grievances.length > 0 ? (
                                                    grievances.map((grievance) => (
                                                        <GlassTableRow key={grievance.id} className="group hover:bg-teal-50/20 transition-all duration-300 border-b border-white/5">
                                                            <GlassTableCell className="pl-10 font-mono font-bold text-slate-400 py-6 group-hover:text-teal-600 transition-colors">
                                                                #{grievance.id.slice(0, 8)}
                                                            </GlassTableCell>
                                                            <GlassTableCell>
                                                                <div className="flex flex-col">
                                                                    <div className="font-bold text-slate-800 tracking-tight group-hover:text-teal-900 transition-colors uppercase">
                                                                        {grievance.title}
                                                                    </div>
                                                                    {/* Duplicate Detection Badge */}
                                                                    {identifiedDuplicates.has(grievance.title?.toLowerCase().trim()) && (
                                                                        <div className="flex items-center gap-1.5 mt-1.5 px-2 py-0.5 w-fit rounded-md bg-amber-50 border border-amber-100 text-[10px] font-black text-amber-600">
                                                                            <Activity className="h-3 w-3" />
                                                                            POTENTIAL DUPLICATE
                                                                        </div>
                                                                    )}

                                                                    {/* SLA Overdue Monitoring Badge */}
                                                                    {grievance.created_at && (grievance.status === 'Submitted' || grievance.status === 'In Progress' || grievance.status === 'In-progress') && (
                                                                        new Date().getTime() - new Date(grievance.created_at).getTime() > 3 * 24 * 60 * 60 * 1000 && (
                                                                            <div className="flex items-center gap-1.5 mt-1.5 px-2 py-0.5 w-fit rounded-md bg-red-50 border border-red-100 text-[10px] font-black text-red-600">
                                                                                <AlertCircle className="h-3 w-3" />
                                                                                SLA OVERDUE
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </GlassTableCell>
                                                            <GlassTableCell>
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100/80 text-slate-700 text-xs font-bold border border-slate-200/50">
                                                                    {grievance.category}
                                                                </span>
                                                            </GlassTableCell>
                                                            <GlassTableCell className="text-slate-600 font-medium">
                                                                <div className="flex flex-col">
                                                                    <span>{grievance.subcategory || 'Unclassified'}</span>
                                                                    {grievance.hostel && (
                                                                        <span className="text-[10px] text-cyan-600 font-black uppercase tracking-widest mt-1">
                                                                            {grievance.hostel}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </GlassTableCell>
                                                            <GlassTableCell className="text-slate-500 font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-3.5 w-3.5 text-slate-300" />
                                                                    {grievance.created_at ? format(new Date(grievance.created_at), 'dd MMM yyyy') : '-'}
                                                                </div>
                                                            </GlassTableCell>
                                                            <GlassTableCell className="text-right pr-10">
                                                                <GlassButton
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="rounded-xl border border-teal-500/10 hover:bg-teal-500 hover:text-white transition-all font-black group/btn active:scale-95"
                                                                    onClick={() => navigate(`/grievances/${grievance.id}`)}
                                                                >
                                                                    <Eye className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                                                                    OPEN CASE
                                                                </GlassButton>
                                                            </GlassTableCell>
                                                        </GlassTableRow>
                                                    ))
                                                ) : (
                                                    <GlassTableRow>
                                                        <GlassTableCell colSpan={6} className="text-center py-32">
                                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                                <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                                                    <Filter className="h-10 w-10 text-slate-400" />
                                                                </div>
                                                                <p className="text-xl font-bold text-slate-900 mb-1">No Entries Found</p>
                                                                <p className="text-sm font-medium">Try adjusting your filters or search term.</p>
                                                            </div>
                                                        </GlassTableCell>
                                                    </GlassTableRow>
                                                )}
                                            </AnimatePresence>
                                        </GlassTableBody>
                                    </GlassTable>

                                    <div className="flex-none flex items-center justify-between px-10 py-6 text-sm text-slate-700 bg-white/40 border-t border-white/20 backdrop-blur-md">
                                        <div className="font-bold flex items-center gap-2 text-slate-500">
                                            <span className="text-slate-900">{totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, totalCount)}</span>
                                            <span>of</span>
                                            <span className="text-slate-900">{totalCount}</span>
                                            <span>Records</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <GlassButton
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage === 1}
                                                className="rounded-xl border-slate-200 px-6 font-bold disabled:opacity-30"
                                                onClick={() => {
                                                    setLoading(true)
                                                    setCurrentPage(prev => Math.max(1, prev - 1))
                                                }}
                                            >
                                                Previous
                                            </GlassButton>
                                            <div className="flex items-center gap-1.5 px-4 py-2 bg-white/80 rounded-xl border border-slate-200 shadow-sm">
                                                <span className="text-slate-400 font-bold uppercase text-[10px]">Page</span>
                                                <span className="text-teal-700 font-black">{currentPage}</span>
                                                <span className="text-slate-300 font-bold">/</span>
                                                <span className="text-slate-900 font-black">{totalPages || 1}</span>
                                            </div>
                                            <GlassButton
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage >= totalPages}
                                                className="rounded-xl border-slate-200 px-6 font-bold disabled:opacity-30"
                                                onClick={() => {
                                                    setLoading(true)
                                                    setCurrentPage(prev => Math.min(totalPages, prev + 1))
                                                }}
                                            >
                                                Next
                                            </GlassButton>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </GlassCardContent>
                </GlassCard>
            </StaggerItem>
        </PageTransition>
    )
}

export default Grievances
