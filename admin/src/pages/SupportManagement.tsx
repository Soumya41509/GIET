import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Phone, HelpCircle, Save, CheckCircle2, AlertCircle, PhoneCall, Mail, MessageSquare, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard, GlassCardContent } from '../components/ui/GlassCard'
import { GlassInput } from '../components/ui/GlassInput'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassTable, GlassTableHeader, GlassTableBody, GlassTableRow, GlassTableHead, GlassTableCell } from '../components/ui/GlassTable'
import { GlassModal } from '../components/ui/GlassModal'
import { studentSupabase as supabase } from '../config/supabase'
import { PageTransition, StaggerItem } from '../components/ui/PageTransition'
import { cn } from '../utils/cn'

const SupportManagement = () => {
    const [activeTab, setActiveTab] = useState<'faq' | 'contacts'>('faq')
    const [faqs, setFaqs] = useState<any[]>([])
    const [contacts, setContacts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [type, setType] = useState<string>('faq')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [faqRes, contactRes] = await Promise.all([
                supabase.from('support_faqs').select('*').order('display_order', { ascending: true }),
                supabase.from('support_contacts').select('*').order('display_order', { ascending: true })
            ])

            if (faqRes.error) throw faqRes.error
            if (contactRes.error) throw contactRes.error

            setFaqs(faqRes.data || [])
            setContacts(contactRes.data || [])
        } catch (error) {
            console.error('Error fetching support data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, table: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return

        try {
            const { error } = await supabase.from(table).delete().eq('id', id)
            if (error) throw error
            fetchData()
        } catch (error) {
            alert('Failed to delete item')
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        const data: any = Object.fromEntries(formData.entries())

        try {
            const table = type === 'faq' ? 'support_faqs' : 'support_contacts'

            if (editingItem) {
                const { error } = await supabase.from(table).update(data).eq('id', editingItem.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from(table).insert([data])
                if (error) throw error
            }

            setIsModalOpen(false)
            setEditingItem(null)
            fetchData()
        } catch (error) {
            alert('Failed to save')
        }
    }

    const getContactIcon = (type: string) => {
        switch (type) {
            case 'phone': return <PhoneCall className="w-4 h-4 text-emerald-500" />
            case 'email': return <Mail className="w-4 h-4 text-blue-500" />
            case 'whatsapp': return <MessageSquare className="w-4 h-4 text-green-500" />
            case 'emergency': return <ShieldAlert className="w-4 h-4 text-red-500" />
            default: return <Phone className="w-4 h-4 text-slate-400" />
        }
    }

    return (
        <PageTransition className="space-y-8 max-w-[1400px] mx-auto p-2">
            <StaggerItem>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Help Center Control</h1>
                        <p className="text-slate-500 font-bold mt-1 text-sm uppercase tracking-wider opacity-60">Architect the student support environment</p>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <GlassButton
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-[1.25rem] px-8 h-12 shadow-2xl shadow-indigo-200/50"
                            onClick={() => {
                                setEditingItem(null)
                                setType(activeTab)
                                setIsModalOpen(true)
                            }}
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Create {activeTab === 'faq' ? 'FAQ' : 'Manual Entry'}
                        </GlassButton>
                    </motion.div>
                </div>
            </StaggerItem>

            <StaggerItem>
                <div className="flex gap-1.5 bg-slate-100/50 p-1.5 rounded-[1.5rem] border border-slate-200/50 backdrop-blur-3xl w-fit">
                    {[
                        { id: 'faq', label: 'Instructional FAQs', icon: HelpCircle },
                        { id: 'contacts', label: 'Response Protocols', icon: Phone }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "relative flex items-center gap-3 px-8 py-3 rounded-[1rem] text-xs font-black transition-all duration-300 uppercase tracking-widest",
                                activeTab === tab.id
                                    ? 'text-indigo-600'
                                    : 'text-slate-400 hover:text-slate-600'
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="tab-bg"
                                    className="absolute inset-0 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] rounded-[1rem]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <tab.icon className={cn("h-4 w-4 relative z-10", activeTab === tab.id ? "text-indigo-600" : "text-slate-400")} />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </StaggerItem>

            <StaggerItem>
                <GlassCard className="rounded-[2.5rem] border-slate-200 shadow-xl overflow-hidden bg-white/40 backdrop-blur-2xl">
                    <GlassCardContent className="p-0">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-20 flex flex-col items-center justify-center space-y-4"
                                >
                                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                                    <div className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Synchronizing Support Latency...</div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <GlassTable>
                                        <GlassTableHeader className="bg-slate-50/80 border-b border-slate-100">
                                            <GlassTableRow>
                                                <GlassTableHead className="pl-10 h-16 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    {activeTab === 'faq' ? 'Primary Question' : 'Context Identity'}
                                                </GlassTableHead>
                                                <GlassTableHead className="h-16 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    {activeTab === 'faq' ? 'Validated Response' : 'Access Logic / Detail'}
                                                </GlassTableHead>
                                                <GlassTableHead className="h-16 text-[10px] font-black uppercase tracking-widest text-slate-400">Sequence</GlassTableHead>
                                                <GlassTableHead className="pr-10 text-right h-16 text-[10px] font-black uppercase tracking-widest text-slate-400">Interface Control</GlassTableHead>
                                            </GlassTableRow>
                                        </GlassTableHeader>
                                        <GlassTableBody>
                                            {(activeTab === 'faq' ? faqs : contacts).map((item, idx) => (
                                                <motion.tr
                                                    key={item.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group hover:bg-indigo-50/30 transition-colors border-b border-slate-50/50"
                                                >
                                                    <GlassTableCell className="pl-10 py-6">
                                                        <div className="flex items-center gap-3">
                                                            {activeTab === 'faq' ? (
                                                                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                                                    <HelpCircle className="w-4 h-4 text-indigo-500" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                                                    {getContactIcon(item.type)}
                                                                </div>
                                                            )}
                                                            <span className="font-bold text-slate-900">{activeTab === 'faq' ? item.question : item.title}</span>
                                                        </div>
                                                    </GlassTableCell>
                                                    <GlassTableCell className="max-w-md">
                                                        <p className="text-slate-500 font-medium line-clamp-2 text-sm italic opacity-80 group-hover:opacity-100 transition-opacity">
                                                            {activeTab === 'faq' ? item.answer : item.detail}
                                                        </p>
                                                    </GlassTableCell>
                                                    <GlassTableCell>
                                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">POS</span>
                                                            <span className="text-xs font-black text-indigo-600">[{item.display_order}]</span>
                                                        </div>
                                                    </GlassTableCell>
                                                    <GlassTableCell className="pr-10 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingItem(item)
                                                                    setType(activeTab)
                                                                    setIsModalOpen(true)
                                                                }}
                                                                className="p-2.5 hover:bg-white hover:shadow-lg text-indigo-600 rounded-xl transition-all"
                                                                title="Edit Protocol"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item.id, activeTab === 'faq' ? 'support_faqs' : 'support_contacts')}
                                                                className="p-2.5 hover:bg-white hover:shadow-lg text-rose-500 rounded-xl transition-all"
                                                                title="Purge Logic"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </GlassTableCell>
                                                </motion.tr>
                                            ))}
                                        </GlassTableBody>
                                    </GlassTable>

                                    {((activeTab === 'faq' ? faqs : contacts).length === 0) && (
                                        <div className="p-20 text-center space-y-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto border border-slate-100">
                                                <AlertCircle className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <div>
                                                <h3 className="text-slate-900 font-black uppercase tracking-widest">Environment Empty</h3>
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Initialize your first support protocol entry</p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </GlassCardContent>
                </GlassCard>
            </StaggerItem>

            <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-8 space-y-8">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-2"
                            >
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Protocol Forge</span>
                            </motion.div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                {editingItem ? 'Re-calibrate' : 'Initialize'} {type === 'faq' ? 'FAQ' : 'Manual'}
                            </h2>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest italic opacity-60">System identity modification node</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                                    {type === 'faq' ? 'Core Inquiry' : 'Manual Identity'}
                                </label>
                                <GlassInput
                                    name={type === 'faq' ? 'question' : 'title'}
                                    defaultValue={editingItem?.question || editingItem?.title}
                                    placeholder={type === 'faq' ? "Input primary query..." : "Identity title"}
                                    required
                                    className="h-14 rounded-2xl bg-slate-50/50 border-slate-200/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                                    {type === 'faq' ? 'Protocol Output' : 'Target Detail / Connectivity'}
                                </label>
                                {type === 'faq' ? (
                                    <textarea
                                        name="answer"
                                        defaultValue={editingItem?.answer}
                                        className="w-full bg-slate-50/50 border border-slate-200/50 focus:border-indigo-500/30 focus:bg-white rounded-[1.5rem] p-5 transition-all min-h-[160px] outline-none text-slate-700 font-medium text-sm leading-relaxed"
                                        placeholder="Formulate the validated protocol response..."
                                        required
                                    />
                                ) : (
                                    <GlassInput
                                        name="detail"
                                        defaultValue={editingItem?.detail}
                                        placeholder="e.g. +91 9988776655 or mail@inst.edu"
                                        required
                                        className="h-14 rounded-2xl bg-slate-50/50 border-slate-200/50"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Priority Seq.</label>
                                <GlassInput
                                    type="number"
                                    name="display_order"
                                    defaultValue={editingItem?.display_order || 0}
                                    className="h-14 rounded-2xl bg-slate-50/50 border-slate-200/50"
                                />
                            </div>
                            {type === 'contacts' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Class Signature</label>
                                    <select
                                        name="type"
                                        defaultValue={editingItem?.type || 'phone'}
                                        className="w-full h-14 bg-slate-50/50 rounded-2xl px-5 text-sm font-bold text-slate-700 outline-none border border-slate-200/50 focus:border-indigo-500/30 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="phone">⚡ Phone / Voice</option>
                                        <option value="email">📧 Official Mail</option>
                                        <option value="emergency">🚨 Critical / SOS</option>
                                        <option value="whatsapp">💬 WhatsApp / Chat</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-slate-100">
                            <GlassButton
                                type="button"
                                variant="ghost"
                                className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Discard
                            </GlassButton>
                            <GlassButton
                                type="submit"
                                className="flex-1 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-2xl shadow-indigo-100 font-black uppercase tracking-[0.2em]"
                            >
                                <Save className="h-5 w-5 mr-3" />
                                Commit Protocol
                            </GlassButton>
                        </div>
                    </form>
                </div>
            </GlassModal>
        </PageTransition>
    )
}

export default SupportManagement

