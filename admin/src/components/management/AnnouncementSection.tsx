import { useState } from 'react'
import { Loader2, CheckCircle2, Shield, Bell, Send, ShieldCheck, AlertTriangle, Flame } from 'lucide-react'
import { GlassCard, GlassCardContent } from '../ui/GlassCard'
import { GlassButton } from '../ui/GlassButton'
import { GlassInput } from '../ui/GlassInput'
import { GlassModal } from '../ui/GlassModal'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { motion } from 'framer-motion'

const AnnouncementSection = () => {
    const { error: showError } = useToast()
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [priority, setPriority] = useState<'Normal' | 'High' | 'Critical'>('Normal')
    const [loading, setLoading] = useState(false)
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)

    const handleBroadcast = async () => {
        if (!title.trim() || !message.trim()) {
            showError('Please fill all fields')
            return
        }

        try {
            setLoading(true)
            const { error } = await supabase
                .from('announcements')
                .insert([{
                    title: title.trim(),
                    message: message.trim(),
                    priority: priority
                }])

            if (error) throw error

            // Trigger Edge Function for Push Notifications
            await supabase.functions.invoke('broadcast-push', {
                body: { title: title.trim(), message: message.trim(), priority: priority }
            })

            setIsSuccessModalOpen(true)
            setTitle('')
            setMessage('')
            setPriority('Normal')
        } catch (error: any) {
            console.error('Broadcast failed:', error)
            showError('Failed to deploy broadcast: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const priorityColors = {
        Normal: 'from-emerald-500 to-teal-600',
        High: 'from-orange-500 to-amber-600',
        Critical: 'from-rose-500 to-red-600'
    }

    const priorityBgs = {
        Normal: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        High: 'bg-orange-50 text-orange-700 border-orange-100',
        Critical: 'bg-rose-50 text-rose-700 border-rose-100'
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                {/* Composition Pane */}
                <div className="flex flex-col gap-6">
                    <GlassCard className="border-white/60 bg-white/40 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-0 overflow-hidden ring-1 ring-black/[0.02]">
                        <div className="p-7 border-b border-white/20">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <Shield className="w-6 h-6 text-teal-600" /> Compose Announcement
                            </h3>
                        </div>

                        <GlassCardContent className="p-7 space-y-7">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Message Heading</label>
                                    <span className="text-[10px] font-bold text-slate-400">{title.length}/60</span>
                                </div>
                                <GlassInput
                                    placeholder="Enter a compelling subject line..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value.slice(0, 60))}
                                    className="bg-white/60 h-13 text-base font-bold text-teal-950 placeholder:text-slate-300 placeholder:font-medium"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Detailed Content</label>
                                    <span className="text-[10px] font-bold text-slate-400">{message.length}/200</span>
                                </div>
                                <textarea
                                    className="w-full min-h-[160px] p-6 bg-white/60 border border-white/80 rounded-[2rem] outline-none focus:ring-4 focus:ring-teal-500/10 text-slate-700 font-medium placeholder:text-slate-400 transition-all disabled:opacity-50 shadow-inner resize-none"
                                    placeholder="Describe the announcement in detail..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Priority Classification</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['Normal', 'High', 'Critical'] as const).map((p) => {
                                        const active = priority === p
                                        const Icon = p === 'Normal' ? ShieldCheck : p === 'High' ? AlertTriangle : Flame
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setPriority(p)}
                                                disabled={loading}
                                                className={`relative group h-20 rounded-[1.5rem] border transition-all duration-500 overflow-hidden ${active
                                                    ? `border-transparent shadow-2xl`
                                                    : `bg-white/40 border-white/80 text-slate-400 hover:border-slate-300 hover:bg-white/60`
                                                    }`}
                                            >
                                                {active && (
                                                    <motion.div
                                                        layoutId="active-priority-bg"
                                                        className={`absolute inset-0 bg-gradient-to-br ${priorityColors[p]}`}
                                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                    />
                                                )}
                                                {active && (
                                                    <div className="absolute inset-0 bg-white/10 blur-xl"></div>
                                                )}
                                                <div className={`relative z-10 flex flex-col items-center justify-center gap-1.5 transition-all duration-500 ${active ? 'text-white scale-110' : 'text-slate-500 group-hover:scale-105'}`}>
                                                    <Icon className={`w-5 h-5 ${active ? 'drop-shadow-lg' : ''}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{p}</span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </GlassCardContent>

                        <div className="px-7 pb-7">
                            <GlassButton
                                variant="primary"
                                className="w-full h-15 rounded-[2rem] font-black text-base shadow-2xl shadow-teal-500/20 group overflow-hidden"
                                onClick={handleBroadcast}
                                disabled={loading || !title || !message}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 up-cyan-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative flex items-center justify-center gap-3">
                                    {loading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    )}
                                    {loading ? 'DEPLOYING...' : 'INITIALIZE BROADCAST'}
                                </div>
                            </GlassButton>
                        </div>
                    </GlassCard>
                </div>

                {/* Live Preview Pane */}
                <div className="space-y-6 xl:sticky xl:top-4">
                    <div className="flex items-center justify-between px-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Live Delivery Preview</label>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Realtime Feed</span>
                        </div>
                    </div>

                    <div className="relative">
                        {/* Device Frame - Adjusted size */}
                        <div className="mx-auto w-[270px] h-[540px] rounded-[3rem] border-[8px] border-slate-900 bg-slate-900 shadow-2xl relative overflow-hidden ring-4 ring-white/10">
                            {/* StatusBar */}
                            <div className="h-6 flex items-center justify-between px-6 pt-2">
                                <span className="text-[9px] font-bold text-white">9:41</span>
                                <div className="flex gap-1">
                                    <div className="h-2 w-2 rounded-full border border-white/50"></div>
                                    <div className="h-2 w-2 rounded-full border border-white"></div>
                                </div>
                            </div>

                            {/* App Content Placeholder */}
                            <div className="mt-4 px-4 space-y-3 opacity-20">
                                <div className="h-24 w-full bg-white/10 rounded-2xl"></div>
                                <div className="h-4 w-1/2 bg-white/10 rounded-full"></div>
                                <div className="h-32 w-full bg-white/10 rounded-2xl"></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="h-20 w-full bg-white/10 rounded-2xl"></div>
                                    <div className="h-20 w-full bg-white/10 rounded-2xl"></div>
                                </div>
                            </div>

                            {/* Notification Simulation Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-50">
                                <motion.div
                                    className="bg-white rounded-3xl w-full p-4 shadow-2xl overflow-hidden border border-white/20"
                                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    transition={{ type: "spring", damping: 12 }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-2.5 rounded-xl border ${priorityBgs[priority]}`}>
                                            <Bell className="w-4 h-4" />
                                        </div>
                                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase text-white bg-gradient-to-r ${priorityColors[priority]}`}>
                                            {priority}
                                        </div>
                                    </div>

                                    <h4 className="text-sm font-black text-slate-800 leading-tight break-words">
                                        {title || 'Message Heading'}
                                    </h4>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1 break-words">
                                        {message || 'Details appear here...'}
                                    </p>

                                    <div className="mt-4 h-9 rounded-xl flex items-center justify-center bg-slate-900 border border-slate-800">
                                        <span className="text-[10px] font-bold text-white">Acknowledge</span>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Connection Lines Simulation */}
                        <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-10 h-px bg-gradient-to-r from-teal-500 to-transparent hidden xl:block"></div>
                        <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-10 h-px bg-gradient-to-l from-teal-500 to-transparent hidden xl:block"></div>
                    </div>

                    {/* Notice for Push Notifications */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mx-auto max-w-[380px] p-5 rounded-[2rem] bg-amber-50 border border-amber-200/60 shadow-xl shadow-amber-900/5 backdrop-blur-md flex gap-4 items-start"
                    >
                        <div className="mt-1 p-2 rounded-xl bg-amber-100 text-amber-600 shadow-inner">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="space-y-1.5 font-bold">
                            <p className="text-xs font-black text-amber-900 uppercase tracking-widest bg-amber-200/30 w-fit px-2 py-0.5 rounded-md">Delivery Protocol</p>
                            <p className="text-[11px] leading-relaxed text-amber-800">
                                Broadcasts appear in the student app's notification center only (No Push). <span className="text-emerald-700 font-black">Staff members will receive real-time push notifications.</span>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <GlassModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                title="Broadcast Successfully Deployed"
            >
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                        <div className="relative h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center shadow-xl shadow-emerald-500/10 border-2 border-emerald-100">
                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight italic">TRANSMISSION COMPLETE</h3>
                        <p className="text-slate-500 font-medium px-4">
                            Your announcement has been successfully broadcasted to all active staff members in the system.
                        </p>
                    </div>
                    <GlassButton
                        variant="primary"
                        onClick={() => setIsSuccessModalOpen(false)}
                        className="w-full h-14 bg-slate-900 text-white shadow-2xl hover:bg-black transition-all rounded-[1.5rem] font-bold"
                    >
                        Return to Command
                    </GlassButton>
                </div>
            </GlassModal>
        </div>
    )
}

export default AnnouncementSection