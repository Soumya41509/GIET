import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Clock, User, Check, XCircle, Timer, Layers, Activity, Home } from 'lucide-react'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { supabase as studentSupabase } from '../lib/supabase'
import { supabase as adminSupabase } from '../config/supabase'
import { StatusSelect } from '../components/ui/StatusSelect'
import { GrievanceDetailsSkeleton } from '../components/ui/SkeletonLoader'
import { RejectModal } from '../components/ui/RejectModal'
import { useAuth } from '../contexts/AuthContext'
import ImageGallery from '../components/grievances/ImageGallery'
import { StaffSelectionModal } from '../components/grievances/StaffSelectionModal'
import { useToast } from '../contexts/ToastContext'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition, StaggerItem } from '../components/ui/PageTransition'

const GrievanceDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const toast = useToast()
    const [grievance, setGrievance] = useState<any>(null)
    const [student, setStudent] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const updatingRef = useRef(false)

    const [timeline, setTimeline] = useState<any[]>([])
    const [viewers, setViewers] = useState<any[]>([])
    const [staffList, setStaffList] = useState<any[]>([])
    const [escalationSteps, setEscalationSteps] = useState<any[]>([])
    const [timeLeft, setTimeLeft] = useState<string>('')

    // Reject modal state
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
    const [rejecting, setRejecting] = useState(false)
    const [hoveredViewerIdx, setHoveredViewerIdx] = useState<number | null>(null)
    const [adminName, setAdminName] = useState<string>('Admin')

    // Real-time subscription for grievance updates & presence
    useEffect(() => {
        if (id) {
            fetchGrievance()
            fetchTimeline()
            fetchStaff()

            // 1. Presence Channel
            const presenceChannel = studentSupabase.channel(`presence_grievance_${id}`, {
                config: {
                    presence: { key: user?.email || 'Unknown' }
                }
            })

            presenceChannel
                .on('presence', { event: 'sync' }, () => {
                    const state = presenceChannel.presenceState()
                    const activeViewers: any[] = []
                    for (const key in state) {
                        if (state[key] && (state[key] as any).length > 0) {
                            activeViewers.push((state[key] as any)[0])
                        }
                    }
                    // Filter out ourselves
                    setViewers(activeViewers.filter((v: any) => v.email !== user?.email))
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED' && user?.email) {
                        // Fetch admin name for presence
                        const { data: profile } = await adminSupabase
                            .from('admins')
                            .select('name')
                            .eq('email', user.email)
                            .single();

                        if (profile?.name) setAdminName(profile.name);

                        await presenceChannel.track({
                            email: user.email,
                            name: profile?.name || 'Admin',
                            online_at: new Date().toISOString()
                        })
                    }
                })

            // Subscribe to changes for this specific grievance
            const grievanceSubscription = studentSupabase
                .channel(`grievance_${id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'grievances',
                    filter: `id=eq.${id}`
                }, (payload) => {
                    console.log('Grievance updated:', payload)
                    setGrievance(payload.new)
                })
                .subscribe()

            // Subscribe to timeline changes for this grievance
            const timelineSubscription = studentSupabase
                .channel(`timeline_${id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'grievance_timeline',
                    filter: `grievance_id=eq.${id}`
                }, () => {
                    console.log('Timeline updated')
                    fetchTimeline()
                })
                .subscribe()

            return () => {
                presenceChannel.untrack()
                presenceChannel.unsubscribe()
                grievanceSubscription.unsubscribe()
                timelineSubscription.unsubscribe()
            }
        }
    }, [id, user?.email])

    // Countdown Timer logic
    useEffect(() => {
        if (!grievance?.escalation_deadline || grievance.status === 'Resolved' || grievance.status === 'Rejected' || grievance.status === 'Unresponsive') {
            setTimeLeft('');
            return;
        }

        const updateTimer = () => {
            const now = new Date().getTime();
            const target = new Date(grievance.escalation_deadline).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft('OVERDUE');
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff / (1000 * 60)) % 60);
            const s = Math.floor((diff / 1000) % 60);

            // Format: 1h 24m 10s
            let timeStr = '';
            if (h > 0) timeStr += `${h}h `;
            if (m > 0 || h > 0) timeStr += `${m}m `;
            timeStr += `${s}s`;

            setTimeLeft(timeStr);
        };

        const timer = setInterval(updateTimer, 1000);
        updateTimer();

        return () => clearInterval(timer);
    }, [grievance?.escalation_deadline, grievance?.status]);

    const fetchGrievance = async () => {
        try {
            setLoading(true)
            const { data, error } = await studentSupabase
                .from('grievances')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setGrievance(data)

            // 1. Fetch student profile from Student DB (where student accounts reside)
            if (data.user_id) {
                console.log('🔍 Fetching profile for user_id:', data.user_id)

                // Try Student Database First
                let { data: profileData, error: profileError } = await studentSupabase
                    .from('profiles')
                    .select('*') // Select all to avoid missing column errors (e.g. photo_url)
                    .eq('id', data.user_id)
                    .single()

                if (profileError || !profileData) {
                    console.warn('⚠️ Could not find profile in student database, trying admin database...', profileError)
                    // Fallback to Admin Database (Profiles might be synced or stored here)
                    const { data: adminProfile, error: adminError } = await adminSupabase
                        .from('profiles')
                        .select('*')
                        .eq('id', data.user_id)
                        .single()

                    if (adminProfile) {
                        profileData = adminProfile
                        console.log('✅ Found profile in admin database!')
                    } else {
                        console.error('❌ Profile not found in either database.', adminError)
                    }
                }

                if (profileData) {
                    console.log('✅ Student Profile Loaded:', profileData)
                    setStudent({
                        name: profileData.name || profileData.full_name || 'Student',
                        email: profileData.email || '',
                        rollNo: profileData.roll_no || profileData.rollNo || 'N/A',
                        department: profileData.department || 'General',
                        avatar: profileData.photo_url || profileData.avatar_url
                    })
                } else {
                    // Final Fallback for UI
                    setStudent({
                        name: 'Student',
                        email: '',
                        rollNo: 'Unknown',
                        department: 'General'
                    })
                }
            }// 2. Fetch Flow Steps from Student DB
            if (data.flow_snapshot_id) {
                const { data: steps } = await studentSupabase
                    .from('escalation_steps')
                    .select('*')
                    .eq('flow_id', data.flow_snapshot_id)
                    .order('step_order', { ascending: true });

                if (steps) setEscalationSteps(steps);
            }
        } catch (error) {
            console.error('Error fetching grievance:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchTimeline = async () => {
        try {
            const { data, error } = await studentSupabase
                .from('grievance_timeline')
                .select('*')
                .eq('grievance_id', id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setTimeline(data || [])
        } catch (error) {
            console.error('Error fetching timeline:', error)
        }
    }

    const fetchStaff = async () => {
        try {
            const { data } = await adminSupabase
                .from('staff')
                .select('id, name, department')
                .eq('status', 'active');
            if (data) setStaffList(data);
        } catch (error) {
            console.error('Error fetching staff:', error)
        }
    }

    const handleStatusUpdate = async (newStatus: string) => {
        if (updatingRef.current) return
        if (newStatus === grievance.status) return
        // Lock — Unresponsive grievances cannot be modified
        if (grievance.status === 'Unresponsive') {
            toast.error('This grievance is locked. No changes allowed.')
            return
        }

        try {
            updatingRef.current = true
            setUpdating(true)

            const updateData: any = {
                status: newStatus,
                last_modified_by_name: adminName
            }

            const { error: updateError } = await studentSupabase
                .from('grievances')
                .update(updateData)
                .eq('id', id as string)

            if (updateError) throw updateError

            // Add timeline entry for status update
            await studentSupabase.from('grievance_timeline').insert({
                grievance_id: id,
                status: newStatus,
                description: `Grievance status updated to ${newStatus} by Admin (${adminName}).`,
                completed: true
            });

            await new Promise(resolve => setTimeout(resolve, 500))
            setGrievance((prev: any) => ({ ...prev, status: newStatus }))
            fetchTimeline()
            toast.success(`Status updated to ${newStatus}`)
        } catch (error: any) {
            console.error('Error updating status:', error)
            toast.error(`Update failed: ${error.message}`)
        } finally {
            setUpdating(false)
            updatingRef.current = false
        }
    }

    const handleManualAssign = async (staffId: string) => {
        if (!staffId) return;
        try {
            setUpdating(true);
            const selectedStaff = staffList.find(s => s.id === staffId);

            const { error: updateError } = await studentSupabase
                .from('grievances')
                .update({
                    assigned_staff_id: staffId,
                    is_manually_assigned: true,
                    status: 'In Progress', // Move to In Progress when reassigned
                    last_modified_by_name: adminName
                } as any)
                .eq('id', id);

            if (updateError) throw updateError;

            // Add timeline entry
            await studentSupabase.from('grievance_timeline').insert({
                grievance_id: id,
                status: 'Reassigned',
                description: `Grievance manually reassigned to ${selectedStaff?.name || 'Staff'} by Admin.`,
                completed: true
            });

            toast.success(`Assigned to ${selectedStaff?.name}`);
            fetchGrievance();
            fetchTimeline();
        } catch (error: any) {
            toast.error(`Assignment failed: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    const handleRejectGrievance = async (reason: string, template?: string) => {
        // Lock — Unresponsive grievances cannot be modified
        if (grievance.status === 'Unresponsive') {
            toast.error('This grievance is locked. No changes allowed.')
            return
        }
        try {
            setRejecting(true)

            const { error: updateError } = await studentSupabase
                .from('grievances')
                .update({
                    status: 'Rejected',
                    rejection_reason: reason,
                    rejection_template: template,
                    last_modified_by_name: adminName
                })
                .eq('id', id as string)

            if (updateError) throw updateError

            // Add timeline entry for rejection
            await studentSupabase.from('grievance_timeline').insert({
                grievance_id: id,
                status: 'Rejected',
                description: `Grievance rejected by Admin (${adminName}). Reason: ${reason}`,
                completed: true
            });

            // Cleanup Storage
            try {
                const [studentRes, staffRes] = await Promise.all([
                    studentSupabase.storage.from('grievances').list(`${id}/student`),
                    studentSupabase.storage.from('grievances').list(`${id}/staff`)
                ])

                const finalPaths: string[] = []
                if (studentRes.data) studentRes.data.forEach(f => f.name !== '.emptyFolderPlaceholder' && finalPaths.push(`${id}/student/${f.name}`))
                if (staffRes.data) staffRes.data.forEach(f => f.name !== '.emptyFolderPlaceholder' && finalPaths.push(`${id}/staff/${f.name}`))

                if (finalPaths.length > 0) {
                    await studentSupabase.storage.from('grievances').remove(finalPaths)
                }
            } catch (storageErr) {
                console.warn('Storage cleanup warning:', storageErr)
            }

            setGrievance((prev: any) => ({
                ...prev,
                status: 'Rejected',
                rejection_reason: reason
            }))

            await fetchTimeline()
            toast.success('Grievance rejected successfully')
            setIsRejectModalOpen(false)
        } catch (error: any) {
            console.error('Error rejecting grievance:', error)
            toast.error(`Failed to reject: ${error.message}`)
        } finally {
            setRejecting(false)
        }
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Resolved': return 'success'
            case 'In Progress':
            case 'In-progress': return 'warning'
            case 'Submitted': return 'neutral'
            case 'Rejected': return 'error'
            case 'Unresponsive': return 'warning'
            default: return 'neutral'
        }
    }

    if (loading) return <GrievanceDetailsSkeleton />
    if (!grievance) return <div className="flex items-center justify-center h-screen text-slate-500">Grievance not found</div>

    return (
        <PageTransition className="space-y-6">
            <StaggerItem>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <GlassButton variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </GlassButton>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-teal-900">Grievance Details</h1>
                                <Badge variant={getStatusVariant(grievance.status) as any}>
                                    {grievance.status}
                                </Badge>
                            </div>
                            <p className="text-slate-500 text-sm">ID: {grievance.id}</p>
                            <p className="text-slate-500 text-sm">Created on {format(new Date(grievance.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                        </div>
                    </div>

                    {viewers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 bg-white/60 backdrop-blur-xl border border-white/80 pl-3 pr-4 py-1.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.02]"
                        >
                            <div className="flex -space-x-2.5">
                                {viewers.map((viewer, idx) => (
                                    <div
                                        key={idx}
                                        className="relative"
                                        onMouseEnter={() => setHoveredViewerIdx(idx)}
                                        onMouseLeave={() => setHoveredViewerIdx(null)}
                                    >
                                        <motion.div
                                            whileHover={{ y: -3, scale: 1.1 }}
                                            className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-black text-xs shadow-sm cursor-pointer ring-2 ring-teal-500/10 z-10"
                                        >
                                            {viewer.email.charAt(0).toUpperCase()}
                                        </motion.div>

                                        <AnimatePresence>
                                            {hoveredViewerIdx === idx && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: -45 }}
                                                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                                    className="absolute left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white py-1.5 px-3 rounded-lg shadow-xl z-50 whitespace-nowrap border border-white/10"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-teal-400 uppercase tracking-tighter leading-none mb-1">Active Admin</span>
                                                        <span className="text-[11px] font-bold leading-none">{viewer.name || 'Admin'}</span>
                                                    </div>
                                                    {/* Arrow */}
                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/90 rotate-45 border-r border-b border-white/10" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 border-l border-slate-200/60 pl-3 ml-1">
                                <div className="relative flex h-2 w-2">
                                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></div>
                                    <div className="relative inline-flex rounded-full h-2 w-2 bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Live Presence
                                </span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </StaggerItem>

            <StaggerItem>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Info & Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        <GlassCard>
                            <GlassCardContent className="p-6">
                                <h2 className="text-xl font-semibold text-teal-900 mb-4">{grievance.title}</h2>
                                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {grievance.description}
                                </p>
                                <ImageGallery grievance={grievance} />
                            </GlassCardContent>
                        </GlassCard>

                        {/* Reopen Details (If Reopened) */}
                        {grievance.status === 'Reopened' && (
                            <GlassCard className="border-fuchsia-500/30 bg-fuchsia-50/20 shadow-[0_8px_32px_rgba(217,70,239,0.06)] overflow-hidden">
                                <div className="h-1.5 w-full bg-gradient-to-r from-fuchsia-400 to-pink-500" />
                                <GlassCardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-fuchsia-100 text-fuchsia-600">
                                            <Activity className="h-5 w-5" />
                                        </div>
                                        <GlassCardTitle className="text-fuchsia-950 font-black">Challenged Resolution</GlassCardTitle>
                                    </div>
                                    <Badge variant="error" className="bg-fuchsia-500 text-white border-none shadow-lg shadow-fuchsia-500/20">ACTION REQUIRED</Badge>
                                </GlassCardHeader>
                                <GlassCardContent className="p-6 pt-3 space-y-5">
                                    <div className="p-4 rounded-2xl bg-white/80 border border-fuchsia-100/50 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-400" />
                                        <label className="text-[9px] font-black text-fuchsia-400 uppercase tracking-[0.2em] block mb-2">Student's Statement</label>
                                        <p className="text-sm font-bold text-slate-800 leading-relaxed italic">
                                            "{grievance.reopen_reason}"
                                        </p>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Subcategory</label>
                                            <p className="text-xs font-bold text-slate-700">{grievance.subcategory || 'General'}</p>
                                        </div>
                                        <div className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Primary Category</label>
                                            <p className="text-xs font-bold text-slate-700">{grievance.category}</p>
                                        </div>
                                    </div>

                                    {grievance.reopen_proof_paths && grievance.reopen_proof_paths.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-px flex-1 bg-slate-100" />
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Visual Evidence</label>
                                                <div className="h-px flex-1 bg-slate-100" />
                                            </div>
                                            <ImageGallery grievance={{ ...grievance, image_paths: grievance.reopen_proof_paths }} overrideLabel="Proof of Incomplete Resolution" />
                                        </div>
                                    )}
                                </GlassCardContent>
                            </GlassCard>
                        )}

                        <GlassCard>
                            <GlassCardHeader>
                                <GlassCardTitle>Timeline</GlassCardTitle>
                            </GlassCardHeader>
                            <GlassCardContent>
                                <div className="relative space-y-6 pl-4 before:absolute before:left-[27px] before:top-2 before:h-full before:w-0.5 before:bg-slate-200">
                                    <div className="relative flex gap-4">
                                        <div className="absolute left-0 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-slate-50 z-10">
                                            <User className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div className="flex-1 pt-0.5 pl-8">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-slate-900">{student?.name || 'Student'}</span>
                                                <span className="text-xs text-slate-500">{format(new Date(grievance.created_at), 'dd MMM, hh:mm a')}</span>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white/40 border border-white/50 text-slate-700 text-sm">
                                                Grievance Submitted
                                            </div>
                                        </div>
                                    </div>

                                    {timeline.map((event) => (
                                        <div key={event.id} className="relative flex gap-4">
                                            <div className="absolute left-0 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-slate-50 z-10">
                                                <Clock className="h-4 w-4 text-orange-500" />
                                            </div>
                                            <div className="flex-1 pt-0.5 pl-8">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-slate-900">
                                                        {event.status === 'Processing' || event.status === 'Resolved' || event.status === 'In Progress' ? 'Staff' : (student?.name || 'Student')}
                                                    </span>
                                                    <span className="text-xs text-slate-500">{format(new Date(event.created_at), 'dd MMM, hh:mm a')}</span>
                                                </div>
                                                <div className="p-3 rounded-xl bg-white/40 border border-white/50 text-slate-700 text-sm">
                                                    {event.description || `Status updated to ${event.status}`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassCardContent>
                        </GlassCard>
                    </div>

                    {/* Right Column - Details & Escalation */}
                    <div className="space-y-6">
                        {/* Combined Details & Hierarchy Sidebar */}
                        <GlassCard className="border-teal-500/10 overflow-hidden">
                            {/* Status Header */}
                            <div className="p-5 border-b border-slate-100 bg-slate-50/30">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Resolution Controls</label>
                                {grievance.status === 'Resolved' ? (
                                    <div className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-bold bg-green-50 text-green-700 border-green-200 shadow-sm">
                                        <span>Resolved</span>
                                        <Check className="h-4 w-4 text-green-600" />
                                    </div>
                                ) : grievance.status === 'Rejected' ? (
                                    <div className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-bold bg-red-50 text-red-700 border-red-200 shadow-sm">
                                        <span>Rejected</span>
                                        <XCircle className="h-4 w-4 text-red-600" />
                                    </div>
                                ) : grievance.status === 'Unresponsive' ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-bold bg-orange-50 text-orange-700 border-orange-200 shadow-sm">
                                            <span>Unresponsive</span>
                                            <XCircle className="h-4 w-4 text-orange-500" />
                                        </div>
                                        <p className="text-[11px] text-orange-600 font-medium bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 leading-snug">
                                            🔒 Locked — No authority responded within the deadline. This grievance cannot be modified by staff or admin.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <StatusSelect
                                            value={grievance.status}
                                            onChange={(newValue) => handleStatusUpdate(newValue)}
                                            disabled={updating}
                                        />
                                        <GlassButton
                                            variant="outline"
                                            className="w-full h-10 border-red-100 text-red-500 hover:bg-red-50 text-xs font-bold"
                                            onClick={() => setIsRejectModalOpen(true)}
                                            disabled={updating}
                                        >
                                            <XCircle className="h-3.5 w-3.5 mr-2" />
                                            Reject Grievance
                                        </GlassButton>
                                    </div>
                                )}
                            </div>

                            <GlassCardContent className="p-5 space-y-6">
                                {/* Manual Assignment Control - Only for Reopened Grievances */}
                                {grievance.status === 'Reopened' && (
                                    <>
                                        <div className="space-y-4 bg-teal-50/30 p-4 rounded-2xl border border-teal-500/10">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-teal-600" />
                                                    <h3 className="text-xs font-black text-teal-950 uppercase tracking-widest">Manual Override</h3>
                                                </div>
                                                {grievance.is_manually_assigned && (
                                                    <Badge variant="warning" className="text-[8px] px-2 py-0 h-4 bg-amber-100 text-amber-700 border-amber-200">ACTIVE</Badge>
                                                )}
                                            </div>
                                            <div className="space-y-2.5">
                                                <button
                                                    className="w-full flex items-center justify-between h-12 px-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-teal-500/40 transition-all group"
                                                    onClick={() => setIsStaffModalOpen(true)}
                                                    disabled={updating}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
                                                            <User className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700">
                                                            {staffList.find(s => s.id === grievance.assigned_staff_id)?.name || 'Assign Staff Member'}
                                                        </span>
                                                    </div>
                                                    <ArrowLeft className="h-4 w-4 -rotate-90 text-slate-400" />
                                                </button>

                                                <div className="flex items-start gap-2 px-1">
                                                    <div className="mt-0.5 p-0.5 rounded-full bg-amber-100">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 font-bold leading-tight">
                                                        Assigning manually will pause the automatic escalation chain for this case.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-px bg-slate-100 w-full" />
                                    </>
                                )}

                                {/* Classification Info List (Card Removed as per User Request) */}
                                <div className="space-y-5 pt-2">
                                    <div className="flex items-start gap-4">
                                        <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                            <Layers className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight mb-0.5">Primary Category</span>
                                            <span className="text-sm font-bold text-slate-800">{grievance.category}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100">
                                            <Activity className="h-4 w-4 text-teal-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-teal-500 uppercase tracking-[0.2em] leading-tight mb-0.5">Subcategory</span>
                                            <span className="text-sm font-bold text-teal-950">{grievance.subcategory || 'General'}</span>
                                        </div>
                                    </div>

                                    {grievance.hostel && (
                                        <div className="flex items-start gap-4">
                                            <div className="h-9 w-9 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0 border border-cyan-100">
                                                <Home className="h-4 w-4 text-cyan-600" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.2em] leading-tight mb-0.5">Hostel Block</span>
                                                <span className="text-sm font-bold text-cyan-950">{grievance.hostel}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4">
                                        <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                                            <Timer className="h-4 w-4 text-amber-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] leading-tight mb-0.5">Urgency Level</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${grievance.priority === 'High' ? 'text-red-600' :
                                                    grievance.priority === 'Medium' ? 'text-amber-600' :
                                                        'text-slate-600'
                                                    }`}>
                                                    {grievance.priority}
                                                </span>
                                                <div className={`h-1.5 w-1.5 rounded-full ${grievance.priority === 'High' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                    grievance.priority === 'Medium' ? 'bg-amber-500' :
                                                        'bg-slate-300'
                                                    }`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 w-full" />

                                <div className="h-px bg-slate-100 w-full" />

                                {/* Escalation Chain Visualization */}
                                {escalationSteps.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Layers className="h-4 w-4 text-teal-600" />
                                            <h3 className="text-xs font-black text-teal-900 uppercase tracking-widest">Escalation Chain</h3>
                                        </div>

                                        <div className="space-y-4 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                            {escalationSteps.map((step, idx) => {
                                                const isActive = grievance.current_step === step.step_order;
                                                const isPast = grievance.current_step > step.step_order;
                                                const staffName = staffList.find(s => s.id === step.staff_id)?.name || 'Assignee';

                                                return (
                                                    <div key={idx} className="relative flex items-start gap-4">
                                                        <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black z-10 
                                                            ${isActive ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105' :
                                                                isPast ? 'bg-teal-50 border-teal-200 text-teal-500' :
                                                                    'bg-white border-slate-200 text-slate-400'}`}>
                                                            {isPast ? <Check className="h-4 w-4" /> : step.step_order}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className={`text-[10px] font-black tracking-tighter uppercase 
                                                                    ${isActive ? 'text-teal-600' : 'text-slate-400'}`}>
                                                                    L{step.step_order} {isActive && '(Current)'}
                                                                </p>
                                                            </div>
                                                            <p className={`text-xs font-bold truncate ${isActive ? 'text-teal-900' : 'text-slate-600'}`}>
                                                                {staffName}
                                                            </p>
                                                            {isActive && timeLeft && (
                                                                <div className={`mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg border font-black text-[10px] w-fit
                                                                    ${timeLeft === 'OVERDUE' ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                                    <Timer className="h-3 w-3" />
                                                                    {timeLeft === 'OVERDUE' ? (
                                                                        'ESCALATION PENDING'
                                                                    ) : (
                                                                        <>
                                                                            {timeLeft}
                                                                            <span className="opacity-70 ml-1">
                                                                                until {idx + 2 <= escalationSteps.length ? `Level ${idx + 2}` : 'Unresponsive'}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </GlassCardContent>
                        </GlassCard>

                        {/* Student Info Card - Compact */}
                        <GlassCard className="border-cyan-500/10">
                            <GlassCardContent className="p-4 flex items-center gap-3">
                                <Avatar
                                    fallback={student?.name ? student.name.substring(0, 2).toUpperCase() : "ST"}
                                    className="h-10 w-10 bg-cyan-100 text-cyan-700"
                                />
                                <div className="flex-1 min-w-0">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Reported By</label>
                                    <p className="text-sm font-bold text-slate-900 truncate">{student?.name || 'Student'}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{student?.department || 'User'}</p>
                                </div>
                            </GlassCardContent>
                        </GlassCard>

                        {/* Rejection Note if applicable */}
                        {grievance.status === 'Rejected' && grievance.rejection_reason && (
                            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 shadow-sm">
                                <label className="text-[10px] font-black text-red-800 uppercase tracking-widest block mb-2">Rejection Reason</label>
                                <p className="text-xs text-red-900 leading-relaxed font-medium">
                                    {grievance.rejection_reason}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </StaggerItem>

            <StaffSelectionModal
                isOpen={isStaffModalOpen}
                onClose={() => setIsStaffModalOpen(false)}
                onSelect={handleManualAssign}
                staffList={staffList}
                currentAssignedId={grievance.assigned_staff_id}
            />

            <RejectModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onConfirm={handleRejectGrievance}
                grievanceId={id || ''}
                loading={rejecting}
            />
        </PageTransition>
    )
}

export default GrievanceDetails
