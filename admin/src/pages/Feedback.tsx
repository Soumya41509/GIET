import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Search, MessageSquare, Users, Eye, GraduationCap, Calendar, Building2, Hash, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard, GlassCardContent, GlassCardHeader } from '../components/ui/GlassCard'
import { GlassInput } from '../components/ui/GlassInput'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassTable, GlassTableHeader, GlassTableBody, GlassTableRow, GlassTableHead, GlassTableCell } from '../components/ui/GlassTable'
import { GlassModal } from '../components/ui/GlassModal'
import { supabase, studentSupabase } from '../config/supabase'
import { TableSkeleton } from '../components/ui/SkeletonLoader'
import { PageTransition, StaggerItem } from '../components/ui/PageTransition'

// SWR global cache
const feedbackCache = {
    staffFeedback: [] as any[],
    studentFeedback: [] as any[],
    isStaffWarmed: false,
    isStudentWarmed: false
}

const Feedback = () => {
    const [activeTab, setActiveTab] = useState<'staff' | 'student'>('staff')
    const [searchTerm, setSearchTerm] = useState('')

    // Feedback States
    const [staffFeedback, setStaffFeedback] = useState<any[]>(feedbackCache.staffFeedback)
    const [studentFeedback, setStudentFeedback] = useState<any[]>(feedbackCache.studentFeedback)

    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedFeedback, setSelectedFeedback] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        if (activeTab === 'staff') {
            fetchStaffFeedback()
        } else {
            fetchStudentFeedback()
        }
    }, [activeTab])

    const fetchStaffFeedback = async (isSilent = false) => {
        try {
            if (!isSilent && !feedbackCache.isStaffWarmed) setLoading(true)
            else if (!isSilent) setIsFetching(true)
            setError(null)

            const { data, error: sbError } = await supabase
                .from('staff_feedback')
                .select(`
                    *,
                    staff (
                        name,
                        department,
                        staff_id
                    )
                `)
                .order('created_at', { ascending: false })

            if (sbError) throw sbError

            setStaffFeedback(data || [])
            feedbackCache.staffFeedback = data || []
            feedbackCache.isStaffWarmed = true
        } catch (err: any) {
            console.error('Error fetching staff feedback:', err)
            setError(err.message || 'Failed to fetch feedback')
        } finally {
            setLoading(false)
            setIsFetching(false)
        }
    }

    const fetchStudentFeedback = async (isSilent = false) => {
        try {
            if (!isSilent && !feedbackCache.isStudentWarmed) setLoading(true)
            else if (!isSilent) setIsFetching(true)
            setError(null)

            // Try student_feedback first (consistent naming), fallback to feedbacks
            let { data, error: sbError } = await studentSupabase
                .from('student_feedback')
                .select(`
                    *,
                    profiles (
                        name,
                        department
                    )
                `)
                .order('created_at', { ascending: false })

            if (sbError && sbError.code === '42P01') {
                const legacy = await studentSupabase
                    .from('feedbacks')
                    .select(`
                        *,
                        profiles (
                            name,
                            department
                        )
                    `)
                    .order('created_at', { ascending: false })
                data = legacy.data
                sbError = legacy.error
            }

            if (sbError) throw sbError

            setStudentFeedback(data || [])
            feedbackCache.studentFeedback = data || []
            feedbackCache.isStudentWarmed = true
        } catch (err: any) {
            console.error('Error fetching student feedback:', err)
            setError(err.message || 'Failed to fetch student feedback')
        } finally {
            setLoading(false)
            setIsFetching(false)
        }
    }

    const filteredStaffFeedback = staffFeedback.filter(f => {
        const matchesSearch =
            f.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.staff?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (f.staff?.staff_id || '').toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch
    })

    const filteredStudentFeedback = studentFeedback.filter(f => {
        const matchesSearch =
            f.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.profiles?.department?.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch
    })

    const handleViewDetails = (feedback: any) => {
        setSelectedFeedback(feedback)
        setIsModalOpen(true)
    }

    const getInitials = (name: string) => {
        return name
            ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : 'US'
    }

    const tabs = [
        { id: 'staff' as const, label: 'Staff', icon: Users, color: 'from-teal-500 to-cyan-600' },
        { id: 'student' as const, label: 'Student', icon: GraduationCap, color: 'from-cyan-600 to-indigo-600' }
    ]

    return (
        <PageTransition className="flex flex-col gap-8">
            {/* Header Cluster */}
            <StaggerItem>
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-slate-800">Feedback Intelligence</h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Monitoring campus sentiment across all departments.
                        </p>
                    </div>

                    <div className="relative flex bg-white/40 p-1.5 rounded-[1.25rem] border border-white/60 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-colors duration-300 z-10 whitespace-nowrap
                                    ${isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    <Icon className={`h-4.5 w-4.5 transition-transform duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:scale-110'}`} />
                                    {tab.label}

                                    {isActive && (
                                        <motion.div
                                            layoutId="feedback-tab-highlight"
                                            className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-xl -z-10 shadow-lg shadow-teal-500/10`}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </StaggerItem>

            {/* Content Area */}
            <StaggerItem>
                <div className="relative min-h-[600px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                            className={`${isFetching ? 'opacity-60' : 'opacity-100'} w-full`}
                        >
                            <GlassCard className="rounded-[2.5rem] border-white/60 shadow-2xl shadow-slate-200/50">
                                <GlassCardHeader className="pb-8 border-b border-slate-100">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="relative w-full md:w-96">
                                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                            <GlassInput
                                                placeholder={activeTab === 'staff' ? "Search staff feedback..." : "Search student feedback..."}
                                                className="pl-12 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-slate-200"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.6)] animate-pulse" />
                                            <span className="text-slate-800 font-bold text-lg">
                                                {activeTab === 'staff' ? filteredStaffFeedback.length : filteredStudentFeedback.length}
                                            </span>
                                            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Submissions</span>
                                        </div>
                                    </div>
                                </GlassCardHeader>

                                <GlassCardContent className="p-0">
                                    {error && (
                                        <div className="m-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
                                            <div className="h-4 w-4 rounded-full bg-red-400 animate-bounce" />
                                            {error}
                                        </div>
                                    )}

                                    {loading ? (
                                        <div className="p-8">
                                            <TableSkeleton />
                                        </div>
                                    ) : (
                                        <GlassTable>
                                            <GlassTableHeader className="bg-slate-50/50 backdrop-blur-md">
                                                <GlassTableRow className="hover:bg-transparent">
                                                    <GlassTableHead className="py-6 pl-8">Timeline</GlassTableHead>
                                                    <GlassTableHead className="py-6">Author</GlassTableHead>
                                                    <GlassTableHead className="py-6">Subject</GlassTableHead>
                                                    <GlassTableHead className="py-6 pr-8 text-right">Actions</GlassTableHead>
                                                </GlassTableRow>
                                            </GlassTableHeader>
                                            <GlassTableBody>
                                                {(activeTab === 'staff' ? filteredStaffFeedback : filteredStudentFeedback).map((item) => (
                                                    <GlassTableRow key={item.id} className="group hover:bg-slate-50 transition-colors">
                                                        <GlassTableCell className="pl-8 py-6">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                                    {format(new Date(item.created_at), 'dd MMM yyyy')}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                                                                    <Clock className="h-3 w-3" />
                                                                    {format(new Date(item.created_at), 'hh:mm a')}
                                                                </div>
                                                            </div>
                                                        </GlassTableCell>
                                                        <GlassTableCell className="py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br transition-transform group-hover:scale-110 flex items-center justify-center text-white font-bold text-xs shadow-lg 
                                                                    ${activeTab === 'staff' ? 'from-teal-400 to-cyan-500 shadow-teal-200' : 'from-blue-400 to-indigo-500 shadow-blue-200'}`}>
                                                                    {getInitials(activeTab === 'staff' ? item.staff?.name : item.profiles?.name)}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-slate-800 text-sm">
                                                                        {activeTab === 'staff' ? item.staff?.name : item.profiles?.name || 'Unknown Student'}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                                        {activeTab === 'staff' ? (item.staff?.department || 'Staff') : (item.profiles?.department || 'Student')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </GlassTableCell>
                                                        <GlassTableCell className="py-6">
                                                            <div className="max-w-[400px] truncate font-semibold text-slate-700 text-sm">
                                                                {item.subject}
                                                            </div>
                                                        </GlassTableCell>
                                                        <GlassTableCell className="pr-8 py-6 text-right">
                                                            <GlassButton
                                                                variant="ghost"
                                                                className="hover:bg-slate-800 hover:text-white rounded-2xl group/btn"
                                                                onClick={() => handleViewDetails(item)}
                                                            >
                                                                <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                                                                Review
                                                            </GlassButton>
                                                        </GlassTableCell>
                                                    </GlassTableRow>
                                                ))}
                                                {(activeTab === 'staff' ? filteredStaffFeedback : filteredStudentFeedback).length === 0 && !loading && (
                                                    <GlassTableRow>
                                                        <GlassTableCell colSpan={4} className="py-32 text-center">
                                                            <div className="flex flex-col items-center gap-4">
                                                                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
                                                                    <MessageSquare className="h-10 w-10 text-slate-200" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-xl font-bold text-slate-800">No signals detected</p>
                                                                    <p className="text-slate-400 font-medium">Clear search or check back later.</p>
                                                                </div>
                                                            </div>
                                                        </GlassTableCell>
                                                    </GlassTableRow>
                                                )}
                                            </GlassTableBody>
                                        </GlassTable>
                                    )}
                                </GlassCardContent>
                            </GlassCard>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </StaggerItem>

            {/* Enhanced Feedback Detail Modal */}
            <GlassModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                className="max-w-2xl px-0"
                hideHeader
            >
                {selectedFeedback && (
                    <div className="px-8 pb-8 pt-4">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className={`h-16 w-16 rounded-3xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl shadow-2xl
                                    ${activeTab === 'staff' ? 'from-teal-500 to-cyan-600 shadow-teal-200' : 'from-blue-500 to-indigo-600 shadow-blue-200'}`}>
                                    {getInitials(activeTab === 'staff' ? selectedFeedback.staff?.name : selectedFeedback.profiles?.name)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {activeTab === 'staff' ? selectedFeedback.staff?.name : selectedFeedback.profiles?.name}
                                    </h2>
                                    <div className="flex gap-2 mt-1">
                                        <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-xl text-xs font-bold">
                                            <Building2 className="h-3 w-3" />
                                            {activeTab === 'staff' ? selectedFeedback.staff?.department : selectedFeedback.profiles?.department || 'General'}
                                        </span>
                                        {activeTab === 'staff' && (
                                            <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-xl text-xs font-bold">
                                                <Hash className="h-3 w-3" />
                                                {selectedFeedback.staff?.staff_id}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <GlassButton variant="ghost" className="rounded-full p-2" onClick={() => setIsModalOpen(false)}>
                                <MessageSquare className="h-5 w-5 text-slate-400" />
                            </GlassButton>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-50/80 rounded-[2rem] p-8 border border-white">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject Reference</p>
                                        <p className="text-xl font-bold text-slate-800">{selectedFeedback.subject}</p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200/50">
                                        <p className="text-slate-600 font-medium leading-relaxed text-lg whitespace-pre-wrap">
                                            {selectedFeedback.message}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-tight">
                                        <Calendar className="h-4 w-4" />
                                        {format(new Date(selectedFeedback.created_at), 'PPP')}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-tight">
                                        <Clock className="h-4 w-4" />
                                        {format(new Date(selectedFeedback.created_at), 'p')}
                                    </div>
                                </div>
                                <GlassButton
                                    className={`rounded-2xl px-12 py-6 font-bold text-white shadow-xl
                                        ${activeTab === 'staff' ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Dismiss Review
                                </GlassButton>
                            </div>
                        </div>
                    </div>
                )}
            </GlassModal>
        </PageTransition>
    )
}

export default Feedback

