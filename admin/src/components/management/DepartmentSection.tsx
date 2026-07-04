import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
    Clock,
    Save,
    Loader2,
    Bell,
    Shield,
    Activity,
    Zap,
    ChevronDown,
    Globe,
    RefreshCcw,
    Info,
    AlertCircle,
    Filter,
    X
} from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { GlassButton } from '../ui/GlassButton'
import { GlassInput } from '../ui/GlassInput'
import { supabase as studentSupabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { Tooltip } from '../ui/Tooltip'
import { grievanceCategories } from '../../data/grievanceData'

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

const DepartmentSection = () => {
    const [settings, setSettings] = useState({
        is_engine_active: true,
        check_interval_minutes: 15,
        grace_period_minutes: 2,
        reminder_lead_minutes: 5,
        max_escalation_levels: 3
    })
    const [activeDept, setActiveDept] = useState<{ id: string, name: string } | null>(null)
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const toast = useToast()

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        setLoading(true)
        try {
            const { data } = await studentSupabase
                .from('sla_settings')
                .select('*')
                .eq('id', 'global')
                .single()
            if (data) setSettings(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchDeptSettings = async (deptId: string) => {
        try {
            const { data } = await studentSupabase
                .from('sla_settings')
                .select('max_escalation_levels')
                .eq('id', deptId)
                .maybeSingle()

            if (data) {
                setSettings(prev => ({ ...prev, ...data }))
            } else {
                // If no override, use global values as starting point
                const { data: globalData } = await studentSupabase
                    .from('sla_settings')
                    .select('max_escalation_levels')
                    .eq('id', 'global')
                    .single()
                if (globalData) setSettings(prev => ({ ...prev, ...globalData }))
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        const targetId = activeDept ? activeDept.id : 'global'

        // Industry-Grade Logic: Dept context ONLY updates escalation protocols
        const payload = activeDept
            ? {
                id: targetId,
                max_escalation_levels: settings.max_escalation_levels,
                updated_at: new Date().toISOString()
            }
            : {
                id: 'global',
                ...settings,
                updated_at: new Date().toISOString()
            }

        try {
            const { error } = await studentSupabase
                .from('sla_settings')
                .upsert(payload)
            if (error) throw error
            toast.success(`Policies for ${activeDept ? activeDept.name : 'Global Core'} synchronized`)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    const [selectedSetting, setSelectedSetting] = useState<string | null>(null)

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
            <div className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Syncing SLA Environment...</div>
        </div>
    )

    return (
        <div className="max-w-[1500px] mx-auto overflow-hidden px-6 pt-2 select-none h-[calc(100vh-140px)] flex flex-col">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse-teal {
                    0% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4); border-color: rgb(20, 184, 166); }
                    70% { box-shadow: 0 0 0 10px rgba(20, 184, 166, 0); border-color: rgb(20, 184, 166); }
                    100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
                }
                .animate-pulse-teal {
                    animation: pulse-teal 1.5s ease-out;
                    z-index: 10;
                }
                .calibration-card-shadow {
                    box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.08);
                }
            `}} />

            {/* Header - Balanced Scale */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SLA Policy Management</h1>
                    <p className="text-xs text-slate-600 mt-1.5 font-bold uppercase tracking-[0.2em]">Live Engine Configuration</p>
                </div>
                <button onClick={fetchSettings} className="p-2.5 text-slate-300 hover:text-slate-600 transition-colors">
                    <RefreshCcw className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
                {/* Status Column */}
                <div className="space-y-6 overflow-y-auto scrollbar-hide pr-2">
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest px-1 italic">Engine Status</h3>

                    <GlassCard className="p-8 border-slate-100 bg-white shadow-md shadow-slate-900/5 transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${settings.is_engine_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-300'}`} />
                                <span className="font-bold text-lg text-slate-900 tracking-tight uppercase">Auto-Escalation</span>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, is_engine_active: !settings.is_engine_active })}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.is_engine_active ? 'bg-slate-900' : 'bg-slate-200'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.is_engine_active ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-bold uppercase tracking-tight">
                            Automated grievance sweep engine for scale hierarchy management.
                        </p>
                    </GlassCard>

                    <div className="space-y-4 shrink-0">
                        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Delay Policy</h4>
                                <p className="text-[11px] text-blue-800 leading-tight font-bold uppercase tracking-tight italic">Propagation typically takes 5-{settings.check_interval_minutes}m.</p>
                            </div>
                        </div>
                        <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start gap-4">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Threshold</h4>
                                <p className="text-[11px] text-amber-900 leading-tight font-black italic">Frequencies below 5m impact DB performance.</p>
                            </div>
                        </div>
                        <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                            <Activity className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Engine Load</h4>
                                <p className="text-[11px] text-indigo-900 leading-tight font-bold opacity-70">High frequency adds engine infrastructure load.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col min-h-0 space-y-3">
                    {/* Console Block 1: The Calibration Engine Hub (State-Aware Canvas) */}
                    <motion.div
                        animate={{
                            backgroundColor: !selectedSetting ? "rgba(255, 255, 255, 0.4)" :
                                selectedSetting === 'frequency' ? "rgba(20, 184, 166, 0.05)" :
                                    selectedSetting === 'grace' ? "rgba(6, 182, 212, 0.05)" :
                                        selectedSetting === 'nudge' ? "rgba(245, 158, 11, 0.05)" :
                                            "rgba(15, 23, 42, 0.04)"
                        }}
                        className={cn(
                            "flex flex-col h-[420px] backdrop-blur-md border border-slate-100 p-5 rounded-[2rem] shadow-sm relative overflow-hidden transition-colors duration-1000",
                        )}
                    >
                        {/* Dynamic Background Watermark */}
                        <AnimatePresence mode="wait">
                            {selectedSetting && (
                                <motion.div
                                    key={`watermark-${selectedSetting}`}
                                    initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
                                    animate={{ opacity: 0.02, scale: 2.2, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 3, rotate: 15 }}
                                    className="absolute -right-8 -top-8 pointer-events-none z-0"
                                >
                                    {selectedSetting === 'frequency' && <Clock className="w-40 h-40" />}
                                    {selectedSetting === 'grace' && <Shield className="w-40 h-40" />}
                                    {selectedSetting === 'nudge' && <Bell className="w-40 h-40" />}
                                    {selectedSetting === 'deadline' && <Zap className="w-40 h-40" />}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center justify-between px-1 shrink-0 pb-3 border-b border-slate-900/5 mb-3 relative z-10">
                            <div>
                                <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocol Calibration</h3>
                                <p className="text-[7px] text-slate-500 mt-0.5 uppercase tracking-wider font-bold italic">Precision Core</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <AnimatePresence>
                                    {selectedSetting && (
                                        <motion.button
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            onClick={() => setSelectedSetting(null)}
                                            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-all"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </motion.button>
                                    )}
                                </AnimatePresence>

                                <Tooltip content="Sync setting to core">
                                    <GlassButton
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="h-7 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-[8px] font-black uppercase tracking-[0.2em]"
                                    >
                                        {saving ? <Loader2 className="w-2.5 h-2.5 animate-spin mr-1.5" /> : <Save className="w-2.5 h-2.5 mr-1.5" />}
                                        Sync Engine
                                    </GlassButton>
                                </Tooltip>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center items-center relative z-10 pb-4">
                            <AnimatePresence mode="wait">
                                {!selectedSetting ? (
                                    <motion.div
                                        key="welcome"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="text-center py-6 space-y-4"
                                    >
                                        <div className="w-16 h-16 bg-white/60 border border-white/80 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                            <Activity className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Active Calibration</h2>
                                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest max-w-[240px] mx-auto leading-relaxed italic">
                                                Select protocol to engage.
                                            </p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={selectedSetting}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                        className="w-full max-w-lg"
                                    >
                                        <div className="p-2 relative z-10">
                                            {(() => {
                                                const settingsMap = {
                                                    frequency: {
                                                        icon: Clock, label: 'Sweep Protocol', title: 'Scan Frequency',
                                                        desc: 'Calibrate database scan intervals.', color: 'teal', field: 'check_interval_minutes',
                                                        unit: 'MINS', sublabel: 'Engine Heartbeat', minVal: 1
                                                    },
                                                    grace: {
                                                        icon: Shield, label: 'Safety Buffer', title: 'Grace Period',
                                                        desc: 'Set post-deadline margin.', color: 'cyan', field: 'grace_period_minutes',
                                                        unit: 'MINS', sublabel: 'Delay Margin', minVal: 0
                                                    },
                                                    nudge: {
                                                        icon: Bell, label: 'Early Warning', title: 'Warning Notification',
                                                        desc: 'Set lead timing for alerts.', color: 'amber', field: 'reminder_lead_minutes',
                                                        unit: 'MINS', sublabel: 'Lead Time', minVal: 1
                                                    },
                                                    deadline: {
                                                        icon: Zap, label: 'Escalation Protocol', title: 'Escalation Depth',
                                                        desc: 'Calibrate chain severity.', color: 'slate', field: 'max_escalation_levels',
                                                        unit: 'LEVELS', sublabel: 'Chain Logic', minVal: 1, maxVal: 6
                                                    }
                                                };

                                                const config = settingsMap[selectedSetting as keyof typeof settingsMap];

                                                if (!config) return null;

                                                const Icon = config.icon;

                                                return (
                                                    <div className="flex flex-col items-center text-center space-y-6">
                                                        {/* Header Portion (Sweet Spot Scale) */}
                                                        <div className="space-y-2.5 flex flex-col items-center">
                                                            <div className={cn(
                                                                "inline-flex items-center gap-3 px-3.5 py-1 rounded-full border mb-0.5",
                                                                config.color === 'teal' ? "bg-teal-500/10 border-teal-100 text-teal-700" :
                                                                    config.color === 'cyan' ? "bg-cyan-500/10 border-cyan-100 text-cyan-700" :
                                                                        config.color === 'amber' ? "bg-amber-500/10 border-amber-100 text-amber-700" :
                                                                            "bg-slate-900/10 border-slate-200 text-slate-800"
                                                            )}>
                                                                <Icon className="w-4 h-4" />
                                                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{config.label}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{config.title}</h3>
                                                                {activeDept && selectedSetting !== 'deadline' && (
                                                                    <div className="px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                                                                        <Globe className="w-2.5 h-2.5" />
                                                                        Core
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {selectedSetting === 'deadline' && (
                                                                <button
                                                                    onClick={() => setIsDeptModalOpen(true)}
                                                                    className="flex items-center gap-2.5 px-4 py-1.5 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-full transition-all mx-auto mt-0.5"
                                                                >
                                                                    <div className={cn("w-2 h-2 rounded-full", activeDept ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                                        {activeDept ? activeDept.name : 'Global Core'}
                                                                    </span>
                                                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                                                </button>
                                                            )}
                                                            <p className="text-[12px] text-slate-700 font-bold max-w-sm mx-auto leading-tight italic mt-0.5">
                                                                {config.desc}
                                                            </p>
                                                        </div>

                                                        {/* Central Input Engine (High-Fidelity) */}
                                                        <div className={cn(
                                                            "flex items-center justify-center gap-8 w-full max-w-md backdrop-blur-sm border p-4 px-10 rounded-[2.5rem] shadow-2xl transition-colors duration-500",
                                                            config.color === 'teal' ? "bg-white border-teal-500/20 shadow-teal-500/10" :
                                                                config.color === 'cyan' ? "bg-white border-cyan-500/20 shadow-cyan-500/10" :
                                                                    config.color === 'amber' ? "bg-white border-amber-500/20 shadow-amber-500/10" :
                                                                        "bg-white border-slate-900/10 shadow-slate-900/10"
                                                        )}>
                                                            <div className="relative group">
                                                                <GlassInput
                                                                    autoFocus
                                                                    type="number"
                                                                    value={(settings as any)[config.field]}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                        const val = parseInt(e.target.value) || 0;
                                                                        const clampedVal = Math.max(config.minVal, (config as any).maxVal ? Math.min((config as any).maxVal, val) : val);
                                                                        setSettings({ ...settings, [config.field]: clampedVal });
                                                                    }}
                                                                    className="w-32 h-14 bg-white font-black text-center border-slate-100 text-4xl rounded-2xl shadow-xl transition-all focus:ring-0"
                                                                />
                                                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-slate-200 rounded-full" />
                                                                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-slate-200 rounded-full" />
                                                            </div>
                                                            <div className="flex flex-col items-start leading-none gap-1">
                                                                <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{config.unit}</span>
                                                                <span className={cn(
                                                                    "text-[10px] font-black uppercase tracking-[0.2em]",
                                                                    config.color === 'teal' ? "text-teal-600" :
                                                                        config.color === 'cyan' ? "text-cyan-600" :
                                                                            config.color === 'amber' ? "text-amber-600" : "text-slate-600"
                                                                )}>{config.sublabel}</span>
                                                            </div>
                                                        </div>


                                                        <div className={cn("flex items-center gap-2 opacity-20 pt-2")}>
                                                            <Activity className="w-2.5 h-2.5" />
                                                            <span className="text-[7px] font-black uppercase tracking-[0.3em] italic">Engine Interlocked</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Console Block 2: The Interactive Timeline Bridge */}
                    <div className="p-3 border border-white/60 rounded-[3rem] bg-gradient-to-b from-white/95 to-slate-50/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08),inset_0_0_20px_rgba(255,255,255,0.5)] group shrink-0 transition-all duration-700 relative z-10 mx-auto w-full max-w-2xl border-t-white">
                        <div className="flex items-center justify-between max-w-xl mx-auto relative px-8 py-2">
                            {/* The Connecting Track */}
                            <div className="absolute top-[34px] left-12 right-12 h-[2px] bg-slate-200/50 -translate-y-1/2 overflow-hidden">
                                <motion.div
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="h-full w-1/3 bg-gradient-to-r from-transparent via-teal-400/30 to-transparent"
                                />
                            </div>

                            {[
                                { icon: Bell, label: 'Warning', value: `${settings.reminder_lead_minutes}m Before`, id: 'nudge' },
                                { icon: Clock, label: 'Depth', value: `${settings.max_escalation_levels} Levels`, id: 'deadline' },
                                { icon: Shield, label: 'Grace', value: `${settings.grace_period_minutes}m Margin`, id: 'grace' },
                                { icon: Activity, label: 'Sweep', value: `${settings.check_interval_minutes}m Scan`, id: 'frequency' },
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedSetting(s.id)}
                                    className="relative flex flex-col items-center gap-3 group/node z-10 focus:outline-none transition-transform duration-300 hover:scale-105"
                                >
                                    <div className={cn(
                                        "h-11 w-11 rounded-2xl flex items-center justify-center border transition-all duration-500 relative",
                                        selectedSetting === s.id ? (
                                            s.id === 'deadline' ? "bg-slate-900 border-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.25)] scale-110" :
                                                "bg-teal-500 border-teal-400 text-white shadow-[0_10px_25px_rgba(20,184,166,0.35)] scale-110"
                                        ) :
                                            s.id === 'deadline' ? "bg-white/80 border-slate-200 text-slate-300 shadow-sm" :
                                                "bg-white/80 border-slate-100 text-slate-400 group-hover/node:border-slate-300 group-hover/node:text-slate-600 shadow-sm"
                                    )}>
                                        {/* Animated ring for active state */}
                                        {selectedSetting === s.id && (
                                            <motion.div
                                                layoutId="active-ring"
                                                className="absolute -inset-1.5 border border-teal-500/20 rounded-[1.25rem]"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                            />
                                        )}
                                        <s.icon className={cn("w-4.5 h-4.5 z-10", (s.id === 'frequency' || s.id === 'nudge') && "group-hover/node:rotate-12 transition-transform duration-300")} />
                                    </div>

                                    <div className="text-center transition-all duration-300 group-hover/node:translate-y-[-2px]">
                                        <span className={cn(
                                            "block text-[11px] font-black uppercase tracking-widest",
                                            selectedSetting === s.id ? "text-slate-900" : "text-slate-700"
                                        )}>{s.label}</span>
                                        <span className={cn(
                                            "block text-[9px] font-bold uppercase mt-0.5 tracking-tight",
                                            selectedSetting === s.id ? "text-teal-600" : "text-slate-600"
                                        )}>{s.value}</span>
                                    </div>

                                    {selectedSetting === s.id && (
                                        <motion.div
                                            layoutId="active-dot"
                                            className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {/* Department Selection Modal */}
            <AnimatePresence>
                {isDeptModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-20">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDeptModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                    <Filter className="w-5 h-5 text-emerald-500" />
                                    Protocol Context
                                </h3>
                                <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-wider opacity-60">Select Departmental Scope for Escalation</p>
                            </div>

                            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2">
                                <button
                                    onClick={() => {
                                        setActiveDept(null)
                                        fetchSettings()
                                        setIsDeptModalOpen(false)
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all",
                                        !activeDept ? "bg-slate-900 text-white shadow-lg" : "hover:bg-slate-50 text-slate-600 border border-transparent"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">Global Core Protocol</span>
                                    </div>
                                    {!activeDept && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                </button>

                                {grievanceCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setActiveDept({ id: cat.id, name: cat.name })
                                            fetchDeptSettings(cat.id)
                                            setIsDeptModalOpen(false)
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between p-4 rounded-2xl transition-all",
                                            activeDept?.id === cat.id ? "bg-emerald-500 text-white shadow-lg" : "hover:bg-slate-50 text-slate-600 border border-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                            <span className="text-xs font-black uppercase tracking-widest">{cat.name}</span>
                                        </div>
                                        {activeDept?.id === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 bg-slate-50/50 flex justify-center">
                                <button
                                    onClick={() => setIsDeptModalOpen(false)}
                                    className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
                                >
                                    Dismiss Modal
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default DepartmentSection