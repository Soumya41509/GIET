import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Trash2, Clock, AlertCircle, Save, Settings2, ShieldCheck, Layers, ArrowRight, Timer, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard, GlassCardContent, GlassCardHeader } from '../ui/GlassCard'
import { GlassButton } from '../ui/GlassButton'
import { GlassInput } from '../ui/GlassInput'
import { GlassSelect } from '../ui/GlassSelect'
import { Badge } from '../ui/Badge'
import { supabase as studentSupabase } from '../../lib/supabase'
import { supabase as adminSupabase } from '../../config/supabase'
import { grievanceCategories, hostels } from '../../data/grievanceData'
import { cn } from '../../utils/cn'
import { useToast } from '../../contexts/ToastContext'
import { Tooltip } from '../ui/Tooltip'

interface Staff {
    id: string
    name: string
    department: string
}

interface Step {
    id?: string
    step_order: number
    staff_id: string
    sla_minutes: number
}

interface Flow {
    id: string
    subcategory: string
    hostel?: string
    is_active: boolean
    steps: Step[]
}
// SWR Global Cache for Instant Loading
const escalationCache = {
    flows: [] as Flow[],
    staffList: [] as Staff[],
    isWarmedUp: false
}

const EscalationSection = () => {
    const [flows, setFlows] = useState<Flow[]>(escalationCache.flows)
    const [staffList, setStaffList] = useState<Staff[]>(escalationCache.staffList)
    const [loading, setLoading] = useState(!escalationCache.isWarmedUp)
    const [isFetching, setIsFetching] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null)
    const [activeSubcategory, setActiveSubcategory] = useState<string>('')
    const toast = useToast()
    const [activeCategory, setActiveCategory] = useState<string>('')
    const [activeHostel, setActiveHostel] = useState<string>('Global')
    const [steps, setSteps] = useState<Step[]>([
        { step_order: 1, staff_id: '', sla_minutes: 2 }
    ])
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [flowToDelete, setFlowToDelete] = useState<Flow | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async (isSilent = false) => {
        if (!isSilent && !escalationCache.isWarmedUp) setLoading(true)
        else if (!isSilent) setIsFetching(true)

        try {
            // Fetch Staff from Admin DB
            const { data: staffData } = await adminSupabase
                .from('staff')
                .select('id, name, department')
                .eq('status', 'active')

            if (staffData) {
                setStaffList(staffData)
                escalationCache.staffList = staffData
            }

            // Fetch Flows and Steps from Student DB
            const { data: flowData } = await studentSupabase
                .from('escalation_flows')
                .select(`
                    *,
                    steps:escalation_steps(*)
                `)
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (flowData) {
                const formattedFlows = flowData.map((f: any) => ({
                    ...f,
                    steps: f.steps.sort((a: any, b: any) => a.step_order - b.step_order)
                }))
                setFlows(formattedFlows)
                escalationCache.flows = formattedFlows
            }
            escalationCache.isWarmedUp = true
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
            setIsFetching(false)
        }
    }

    const handleAddStep = () => {
        if (steps.length < 6) {
            setSteps([
                ...steps,
                { step_order: steps.length + 1, staff_id: '', sla_minutes: 2 }
            ])
        }
    }

    const handleRemoveStep = (index: number) => {
        if (steps.length > 1) {
            const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({
                ...s,
                step_order: i + 1
            }))
            setSteps(newSteps)
        }
    }

    const handleStepChange = (index: number, field: keyof Step, value: any) => {
        const newSteps = [...steps]
        newSteps[index] = { ...newSteps[index], [field]: value }
        setSteps(newSteps)
    }

    const handleSaveFlow = async () => {
        // Validation
        if (!activeSubcategory) {
            toast.warning('Please select a sub-category')
            return
        }

        if (steps.some(s => !s.staff_id)) {
            toast.warning('Please assign a staff member to each step')
            return
        }

        if (steps.some(s => s.sla_minutes < 0)) {
            toast.warning('SLA cannot be negative')
            return
        }

        try {
            setLoading(true)

            // 1. Create or Update Flow
            const { data: flowData, error: flowError } = await studentSupabase
                .from('escalation_flows')
                .upsert({
                    ...(selectedFlow?.id ? { id: selectedFlow.id } : {}),
                    subcategory: activeSubcategory,
                    hostel: activeHostel === 'Global' ? null : activeHostel,
                    is_active: true
                }, { onConflict: 'subcategory,hostel' })
                .select()
                .single()

            if (flowError) {
                console.error('Flow Upsert Error:', flowError);
                throw new Error(flowError.message);
            }

            if (!flowData) throw new Error('Failed to retrieve saved flow data');

            // 2. Delete old steps for this flow
            await studentSupabase
                .from('escalation_steps')
                .delete()
                .eq('flow_id', flowData.id)

            // 3. Insert new steps
            const stepsToInsert = steps.map(s => ({
                flow_id: flowData.id,
                step_order: s.step_order,
                staff_id: s.staff_id,
                sla_minutes: s.sla_minutes
            }))

            const { error: stepsError } = await studentSupabase
                .from('escalation_steps')
                .insert(stepsToInsert)

            if (stepsError) {
                console.error('Steps Insert Error:', stepsError);
                throw new Error(stepsError.message);
            }

            toast.success('Escalation flow updated successfully')
            setIsModalOpen(false)
            fetchData()
        } catch (error: any) {
            console.error('Error saving flow:', error)
            toast.error(`Error: ${error.message || 'Unknown failure during save process'}`)
        } finally {
            setLoading(false)
        }
    }

    const openCreateModal = () => {
        setSelectedFlow(null)
        setActiveCategory('')
        setActiveSubcategory('')
        setActiveHostel('Global')
        setSteps([{ step_order: 1, staff_id: '', sla_minutes: 2 }])
        setIsModalOpen(true)
    }

    const openEditModal = (flow: Flow) => {
        setSelectedFlow(flow)
        // Find parent category for this subcategory
        const category = grievanceCategories.find(c =>
            c.subcategories.some(sub => sub === flow.subcategory)
        )
        setActiveCategory(category?.name || '')
        setActiveSubcategory(flow.subcategory)
        setActiveHostel(flow.hostel || 'Global')
        setSteps(flow.steps.map(s => ({ ...s })))
        setIsModalOpen(true)
    }

    const handleDeleteFlow = (flow: Flow) => {
        setFlowToDelete(flow)
        setIsDeleteModalOpen(true)
    }

    const confirmDeleteFlow = async () => {
        if (!flowToDelete) return
        try {
            setLoading(true)
            // 1. Delete steps
            await studentSupabase
                .from('escalation_steps')
                .delete()
                .eq('flow_id', flowToDelete.id)

            // 2. Delete flow
            const { error } = await studentSupabase
                .from('escalation_flows')
                .delete()
                .eq('id', flowToDelete.id)

            if (error) throw error

            toast.success('Escalation flow deleted successfully')
            fetchData()
        } catch (error) {
            console.error('Error deleting flow:', error)
            toast.error('Failed to delete flow')
        } finally {
            setLoading(false)
            setIsDeleteModalOpen(false)
            setFlowToDelete(null)
        }
    }

    const formatSLA = (mins: number) => {
        if (mins >= 1440) {
            const days = mins / 1440;
            const dayStr = (days % 1 === 0) ? days.toString() : days.toFixed(1);
            return `${dayStr} day${days !== 1 ? 's' : ''}`
        }
        if (mins >= 60) {
            const hours = mins / 60;
            const hrStr = (hours % 1 === 0) ? hours.toString() : hours.toFixed(1);
            return `${hrStr} hr${hours !== 1 ? 's' : ''}`
        }
        return `${mins}m`
    }

    return (
        <div className={`space-y-8 transition-opacity duration-300 ${isFetching ? 'opacity-60 pointer-events-none' : 'opacity-100'} relative`}>
            {isFetching && !loading && (
                <div className="absolute top-[-24px] left-0 right-0 h-1 z-50 overflow-hidden rounded-t-3xl">
                    <div className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 w-full animate-[progress_1s_ease-in-out_infinite]"></div>
                </div>
            )}
            {/* Action Bar */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex flex-col md:flex-row justify-between items-center bg-white/60 py-5 px-8 rounded-[2rem] border border-white/80 backdrop-blur-2xl shadow-xl">
                    <div className="mb-4 md:mb-0">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-teal-500/10 rounded-xl text-teal-600">
                                <Layers className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-black text-teal-950 tracking-tight">
                                Escalation Matrix
                            </h2>
                        </div>
                        <p className="text-slate-600 text-[13px] font-medium flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                            {flows.length} active workflows monitoring system latency
                        </p>
                    </div>
                    <GlassButton
                        variant="primary"
                        onClick={openCreateModal}
                        className="px-6 py-3 rounded-xl shadow-lg shadow-teal-500/10 hover:scale-105 active:scale-95 transition-all w-full md:w-auto text-sm font-bold"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Configure New Flow
                    </GlassButton>
                </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {flows.map((flow, index) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            key={flow.id}
                        >
                            <GlassCard className="h-full group border-teal-100/30 overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500">
                                <GlassCardHeader className="bg-gradient-to-br from-white/80 to-transparent border-b border-teal-50/50 p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-white uppercase tracking-tighter bg-teal-500 px-2 py-0.5 rounded shadow-sm">
                                                    Escalation {flow.steps.length}L
                                                </span>
                                                <Badge variant="neutral" className="text-[10px] font-bold bg-teal-50 text-teal-700 border-teal-200">
                                                    {flow.hostel || 'Global Scope'}
                                                </Badge>
                                            </div>
                                            <h3 className="text-lg font-bold text-teal-950 tracking-tight mt-1">
                                                {flow.subcategory}
                                            </h3>
                                        </div>

                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                            <GlassButton variant="ghost" size="icon" onClick={() => openEditModal(flow)} className="h-10 w-10 hover:bg-teal-50 text-teal-600">
                                                <Settings2 className="h-5 w-5" />
                                            </GlassButton>
                                            <GlassButton variant="ghost" size="icon" onClick={() => handleDeleteFlow(flow)} className="h-10 w-10 hover:bg-red-50 text-red-500">
                                                <Trash2 className="h-5 w-5" />
                                            </GlassButton>
                                        </div>
                                    </div>
                                </GlassCardHeader>
                                <GlassCardContent className="p-6 space-y-6">
                                    {/* Visual Chain */}
                                    <div className="space-y-4">
                                        {flow.steps.map((step, idx) => (
                                            <div key={idx} className="relative">
                                                {idx < flow.steps.length - 1 && (
                                                    <div className="absolute left-[17px] top-9 bottom-[-15px] w-0.5 bg-gradient-to-b from-teal-200 via-teal-100 to-transparent z-0 opacity-40"></div>
                                                )}
                                                <div className="relative z-10 flex items-center gap-4 group/step">
                                                    <div className={cn(
                                                        "h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm shadow-lg shrink-0 transition-transform group-hover/step:scale-110",
                                                        idx === 0 ? "bg-teal-500 text-white shadow-teal-500/20" :
                                                            idx === flow.steps.length - 1 ? "bg-cyan-600 text-white shadow-cyan-500/20" :
                                                                "bg-white border-2 border-slate-200 text-slate-600"
                                                    )}>
                                                        {step.step_order}
                                                    </div>
                                                    <div className="flex-1 min-w-0 bg-white/40 border border-white p-3 rounded-2xl group-hover/step:bg-white transition-colors duration-300">
                                                        <div className="flex justify-between items-center gap-2">
                                                            <p className="text-sm font-bold text-slate-800 truncate">
                                                                {staffList.find(s => s.id === step.staff_id)?.name || 'Assignee Not Found'}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md shrink-0">
                                                                <Timer className="h-3 w-3 text-slate-400" />
                                                                <span className="text-[10px] font-black text-slate-700 tabular-nums">
                                                                    {formatSLA(step.sla_minutes)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <GlassButton
                                        variant="outline"
                                        onClick={() => openEditModal(flow)}
                                        className="w-full border-teal-100 text-teal-600 font-bold text-sm bg-white/40 hover:bg-teal-50 group-hover:translate-y-[-2px] transition-transform"
                                    >
                                        Modify Workflow
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </GlassButton>
                                </GlassCardContent>
                            </GlassCard>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {flows.length === 0 && !loading && (
                    <div className="col-span-full py-32 text-center bg-white/30 rounded-[40px] border-4 border-dashed border-teal-50/50 backdrop-blur-sm group hover:border-teal-100 transition-colors">
                        <div className="h-24 w-24 bg-gradient-to-br from-teal-50 to-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-slate-200 border border-white group-hover:scale-110 transition-transform">
                            <Layers className="h-10 w-10 text-teal-200" />
                        </div>
                        <h3 className="text-2xl font-black text-teal-900 tracking-tight">Engine Offline</h3>
                        <p className="text-slate-600 mt-2 font-medium max-w-sm mx-auto">
                            No escalation pathways detected. Configure a flow to ensure zero-latency grievance handling.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal - Enhanced Industrial Premium Aesthetics */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <GlassCard className="w-full max-w-4xl border-white/60 bg-white/95 shadow-2xl backdrop-blur-none animate-in zoom-in-95 duration-200 overflow-hidden rounded-[2.5rem] will-change-transform">
                        {/* Header - Unified Premium Identity */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-teal-600 px-8 py-7 text-white text-center">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>

                            <button
                                onClick={() => !loading && setIsModalOpen(false)}
                                className="absolute right-6 top-6 rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-300 hover:rotate-90 z-20"
                            >
                                <X className="h-6 w-6" />
                            </button>

                            <h2 className="text-2xl font-bold tracking-tight">
                                {selectedFlow ? 'Edit Escalation Flow' : 'Create New Escalation Flow'}
                            </h2>
                            <p className="mt-1 text-cyan-100 opacity-95 text-sm font-medium">
                                Configure automated staff escalation for grievance resolution
                            </p>
                        </div>

                        <GlassCardContent className="p-0">
                            <div className="p-8 space-y-8 max-h-[72vh] overflow-y-auto scrollbar-hide bg-slate-50/10 transition-all duration-500">

                                {/* Section 1: Workflow Configuration */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800">
                                            <ShieldCheck className="h-4 w-4 text-teal-600" /> Workflow Context
                                        </h3>
                                        <Tooltip
                                            side="bottom"
                                            variant="light"
                                            content={
                                                <div className="p-4 space-y-3 min-w-[220px]">
                                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                                                        <ShieldCheck className="h-4 w-4 text-teal-600" />
                                                        <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Protocol Rules</span>
                                                    </div>
                                                    <div className="space-y-2 text-[11px]">
                                                        <div className="flex justify-between gap-4 text-slate-500">
                                                            <span>Tier SLA:</span>
                                                            <span className="text-teal-600 font-bold">Min 1 Minute</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4 text-slate-500">
                                                            <span>Final Tier:</span>
                                                            <span className="text-teal-600 font-bold">Min 1 Minute</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4 text-slate-500">
                                                            <span>Max Depth:</span>
                                                            <span className="text-teal-600 font-bold">6 Operations</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            }>
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/5 hover:bg-slate-900/10 text-slate-600 transition-all cursor-help border border-slate-200">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Protocol Rules</span>
                                            </div>
                                        </Tooltip>
                                    </div>

                                    <div className="bg-white/40 border border-white rounded-[2rem] p-6 shadow-sm border-slate-200/40">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Parent Hierarchy</label>
                                                <GlassSelect
                                                    value={activeCategory}
                                                    onChange={(val) => {
                                                        setActiveCategory(val)
                                                        setActiveSubcategory('')
                                                    }}
                                                    className="bg-white border-slate-200 h-13 shadow-sm text-sm font-bold rounded-2xl"
                                                    options={grievanceCategories.map(cat => ({
                                                        value: cat.name,
                                                        label: cat.name
                                                    }))}
                                                    placeholder="Select department..."
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Operational Node</label>
                                                <GlassSelect
                                                    value={activeSubcategory}
                                                    onChange={(val) => setActiveSubcategory(val)}
                                                    className="bg-white border-slate-200 h-13 shadow-sm text-sm font-bold rounded-2xl"
                                                    disabled={!activeCategory}
                                                    options={grievanceCategories
                                                        .find(c => c.name === activeCategory)
                                                        ?.subcategories.map(sub => ({
                                                            value: sub,
                                                            label: sub
                                                        })) || []}
                                                    placeholder={activeCategory ? "Select issue type..." : "Determine parent first"}
                                                />
                                            </div>
                                        </div>

                                        {activeCategory === 'Hostel' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-6 pt-6 border-t border-slate-100"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <label className="text-[10px] font-black text-teal-700 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                                        <div className="h-1 w-1 rounded-full bg-teal-500"></div>
                                                        Target Hostel Routing Scope
                                                    </label>
                                                </div>
                                                <div className="max-w-md">
                                                    <GlassSelect
                                                        value={activeHostel}
                                                        onChange={(val) => setActiveHostel(val)}
                                                        options={[
                                                            { value: 'Global', label: 'Global (Default Routing for all hostels)' },
                                                            ...(hostels || []).map(hostel => ({ value: hostel, label: hostel }))
                                                        ]}
                                                        placeholder="Assign specific hostel priority..."
                                                        className="bg-white border-teal-100 h-13 shadow-md shadow-teal-500/5 text-sm font-bold rounded-2xl"
                                                    />
                                                </div>
                                                <p className="mt-3 text-[10px] font-medium text-slate-500 italic ml-1">
                                                    Note: Specific hostel flows always take precedence over global ones.
                                                </p>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Section 2: Sequence Builder */}
                                <div className="space-y-7">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                                            <Layers className="h-4 w-4" /> Escalation Sequence
                                        </h3>
                                        <GlassButton
                                            variant="outline"
                                            size="sm"
                                            className="h-9 px-5 text-[10px] font-black uppercase tracking-widest border-teal-200 text-teal-600 hover:scale-[1.02] active:scale-95 transition-transform"
                                            onClick={handleAddStep}
                                            disabled={steps.length >= 6}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Add Tier
                                        </GlassButton>
                                    </div>

                                    <div className="grid gap-5">
                                        {steps.map((step, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 400,
                                                    damping: 30,
                                                    delay: idx * 0.05
                                                }}
                                                className="relative group/row transform-gpu"
                                            >
                                                <div className="bg-white p-2 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-center gap-3 group-hover/row:border-teal-200 group-hover/row:shadow-lg transition-all duration-300">

                                                    {/* Step Badge */}
                                                    <div className="h-15 w-15 md:h-16 md:w-16 rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-white shrink-0 shadow-lg group-hover/row:scale-105 transition-transform duration-300">
                                                        <span className="text-[9px] font-bold opacity-80 uppercase leading-none">Level</span>
                                                        <span className="text-2xl font-black leading-none mt-0.5">0{step.step_order}</span>
                                                    </div>

                                                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 items-end gap-5 p-2">
                                                        {/* Staff Select */}
                                                        <div className="md:col-span-7 space-y-2">
                                                            <Tooltip content="The specific staff or admin role assigned to resolve grievances at this tier.">
                                                                <label className="text-[10px] w-max font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2 cursor-help">
                                                                    <Layers className="h-3 w-3" /> Authority Node
                                                                </label>
                                                            </Tooltip>
                                                            <GlassSelect
                                                                value={step.staff_id}
                                                                onChange={(val) => handleStepChange(idx, 'staff_id', val)}
                                                                className="bg-slate-50 border-transparent h-11 text-sm font-bold group-hover/row:bg-white group-hover/row:border-slate-100 transition-colors"
                                                                options={staffList.map(s => ({
                                                                    value: s.id,
                                                                    label: `${s.name} — ${s.department}`
                                                                }))}
                                                                placeholder="Search authority..."
                                                            />
                                                        </div>

                                                        {/* SLA Input */}
                                                        <div className="md:col-span-3 space-y-2">
                                                            <Tooltip content={<div className="text-center font-medium min-w-[180px]"><p className="text-amber-400 mb-1">Service Level Agreement (SLA)</p><p className="text-white/80">Maximum allowed time in <strong>minutes</strong> before<br />automatic escalation up the chain.</p></div>}>
                                                                <label className="text-[10px] w-max font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2 cursor-help">
                                                                    <Timer className="h-3 w-3" /> Latency (min)
                                                                </label>
                                                            </Tooltip>
                                                            <div className="relative">
                                                                <GlassInput
                                                                    type="number"
                                                                    min="1"
                                                                    max="10080"
                                                                    step="1"
                                                                    value={step.sla_minutes === 0 ? "" : step.sla_minutes}
                                                                    onChange={(e) => {
                                                                        const v = e.target.value;
                                                                        let mins = parseInt(v);
                                                                        if (mins > 10080) mins = 10080;
                                                                        handleStepChange(idx, 'sla_minutes', isNaN(mins) ? 0 : mins);
                                                                    }}
                                                                    onBlur={() => {
                                                                        if (step.sla_minutes === undefined || step.sla_minutes === null) {
                                                                            handleStepChange(idx, 'sla_minutes', 0);
                                                                        }
                                                                    }}
                                                                    className="h-10 pl-9 pr-16 text-sm font-bold bg-slate-50 border-slate-200"
                                                                />
                                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-900 text-white rounded text-[9px] font-black">
                                                                    {formatSLA(step.sla_minutes)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Delete Button */}
                                                        <div className="md:col-span-2 flex justify-end">
                                                            {steps.length > 1 && (
                                                                <button
                                                                    onClick={() => handleRemoveStep(idx)}
                                                                    className="h-11 w-11 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-red-500/20 active:scale-90"
                                                                >
                                                                    <Trash2 className="h-5 w-5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer - Unified Action identity */}
                            <div className="border-t border-slate-100 bg-slate-50 p-5 flex flex-col md:flex-row items-center justify-between gap-6 px-9">
                                <div className="flex items-center gap-4 bg-white/80 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="p-1.5 bg-teal-500/10 rounded-lg text-teal-600">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-600 leading-none mb-1">Total Timeline</span>
                                        <span className="text-base font-black text-teal-900 leading-none">
                                            {formatSLA(steps.reduce((acc, s) => acc + (s.sla_minutes || 0), 0))}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3 w-full md:w-auto">
                                    <GlassButton
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                        className="h-11 px-8 border-slate-200 font-bold rounded-xl text-sm bg-white hover:bg-slate-50"
                                    >
                                        Dismiss
                                    </GlassButton>
                                    <GlassButton
                                        onClick={handleSaveFlow}
                                        disabled={loading}
                                        className="h-11 px-10 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                        {loading ? 'Saving...' : (selectedFlow ? 'Update Flow' : 'Create Flow')}
                                    </GlassButton>
                                </div>
                            </div>
                        </GlassCardContent>
                    </GlassCard>
                </div>,
                document.body
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <GlassCard className="w-full max-w-lg border-white/60 bg-white/95 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden rounded-[2rem]">
                        <div className="p-8 text-center space-y-6">
                            <div className="h-20 w-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto text-red-500 shadow-inner">
                                <Trash2 className="h-10 w-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">System Deletion</h3>
                                <p className="text-slate-600 mt-2 font-medium">
                                    Are you sure you want to terminate the <span className="text-red-600 font-bold">{flowToDelete?.subcategory}</span> workflow? This action is irrevocable.
                                </p>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <GlassButton
                                    variant="outline"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 h-12 border-slate-200 font-bold rounded-xl text-sm bg-white"
                                >
                                    Abort
                                </GlassButton>
                                <GlassButton
                                    onClick={confirmDeleteFlow}
                                    disabled={loading}
                                    className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/20"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Deletion'}
                                </GlassButton>
                            </div>
                        </div>
                    </GlassCard>
                </div>,
                document.body
            )}
        </div>
    )
}

export default EscalationSection;
