import { useState, useEffect } from 'react'
import { Loader2, Trash2, Plus, Info, CheckCircle2, AlertCircle } from 'lucide-react'
import { GlassCard, GlassCardContent } from '../ui/GlassCard'
import { GlassButton } from '../ui/GlassButton'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { motion, AnimatePresence } from 'framer-motion'

interface Tip {
    id: string
    content: string
    is_active: boolean
    created_at: string
}

const TipsSection = () => {
    const { success, error: showError } = useToast()
    const [tips, setTips] = useState<Tip[]>([])
    const [newTip, setNewTip] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    const MAX_LENGTH = 100

    useEffect(() => {
        fetchTips()
    }, [])

    const fetchTips = async () => {
        try {
            setFetching(true)
            const { data, error } = await supabase
                .from('student_tips')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setTips(data || [])
        } catch (err: any) {
            showError('Failed to load tips: ' + err.message)
        } finally {
            setFetching(false)
        }
    }

    const handleAddTip = async () => {
        if (!newTip.trim()) return
        if (newTip.length > MAX_LENGTH) {
            showError(`Tip cannot exceed ${MAX_LENGTH} characters`)
            return
        }

        try {
            setLoading(true)
            const { error } = await supabase
                .from('student_tips')
                .insert([{ content: newTip.trim() }])

            if (error) throw error

            success('Tip added successfully')
            setNewTip('')
            fetchTips()
        } catch (err: any) {
            showError('Failed to add tip: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteTip = async (id: string) => {
        try {
            const { error } = await supabase
                .from('student_tips')
                .delete()
                .eq('id', id)

            if (error) throw error

            success('Tip removed')
            setTips(tips.filter(t => t.id !== id))
        } catch (err: any) {
            showError('Failed to delete tip: ' + err.message)
        }
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Home Page Tips</h2>
                    <p className="text-slate-500 font-medium tracking-wide">Manage the scrolling tips shown on the Student App home screen.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add New Tip Card */}
                <div className="lg:col-span-1">
                    <GlassCard className="sticky top-6 border-white/60 bg-white/40 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-0 overflow-hidden ring-1 ring-black/[0.02]">
                        <div className="p-7 border-b border-white/20 bg-gradient-to-r from-teal-500/5 to-transparent">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <Plus className="w-6 h-6 text-teal-600" /> New Tip
                            </h3>
                        </div>

                        <GlassCardContent className="p-7 space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tip Content</label>
                                    <span className={`text-[10px] font-bold ${newTip.length > MAX_LENGTH ? 'text-red-500' : 'text-slate-400'}`}>
                                        {newTip.length}/{MAX_LENGTH}
                                    </span>
                                </div>
                                <div className="relative">
                                    <textarea
                                        className="w-full min-h-[120px] p-5 bg-white/60 border border-white/80 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-teal-500/10 text-slate-700 font-medium placeholder:text-slate-400 transition-all disabled:opacity-50 shadow-inner resize-none"
                                        placeholder="Enter tip message (e.g. Keep your ID ready...)"
                                        value={newTip}
                                        onChange={(e) => setNewTip(e.target.value)}
                                        disabled={loading}
                                    />
                                    {newTip.length > MAX_LENGTH && (
                                        <div className="absolute top-2 right-2 flex items-center text-red-500 bg-white/80 px-2 py-1 rounded-lg">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            <span className="text-[9px] font-black uppercase">Too Long</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <GlassButton
                                variant="primary"
                                className="w-full h-14 rounded-2xl font-bold text-sm shadow-xl shadow-teal-500/10 group overflow-hidden"
                                onClick={handleAddTip}
                                disabled={loading || !newTip.trim() || newTip.length > MAX_LENGTH}
                            >
                                <div className="relative flex items-center justify-center gap-2">
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    )}
                                    {loading ? 'SAVING...' : 'PUBLISH TIP'}
                                </div>
                            </GlassButton>
                        </GlassCardContent>
                    </GlassCard>
                </div>

                {/* Tips List Card */}
                <div className="lg:col-span-2">
                    <GlassCard className="border-white/60 bg-white/40 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-0 overflow-hidden ring-1 ring-black/[0.02]">
                        <div className="p-7 border-b border-white/20 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <Info className="w-6 h-6 text-teal-600" /> Active Tips ({tips.length})
                            </h3>
                            {fetching && <Loader2 className="w-5 h-5 animate-spin text-teal-600" />}
                        </div>

                        <GlassCardContent className="p-7">
                            <div className="space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {tips.length === 0 && !fetching ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-20 bg-white/30 rounded-3xl border border-dashed border-slate-300"
                                        >
                                            <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-400 font-bold uppercase tracking-widest">No tips found</p>
                                        </motion.div>
                                    ) : (
                                        tips.map((tip, index) => (
                                            <motion.div
                                                key={tip.id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group flex items-center justify-between p-5 bg-white/60 border border-white/80 rounded-[1.5rem] hover:bg-white/80 hover:shadow-lg transition-all duration-300"
                                            >
                                                <div className="flex-1 pr-6 flex items-start gap-4">
                                                    <div className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-teal-50 text-[10px] font-black text-teal-600 border border-teal-100">
                                                        {tips.length - index}
                                                    </div>
                                                    <p className="text-slate-700 font-bold text-base leading-relaxed">{tip.content}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteTip(tip.id)}
                                                    className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </GlassCardContent>
                    </GlassCard>
                </div>
            </div>
        </div>
    )
}

export default TipsSection
