import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GlassCard, GlassCardContent } from '../ui/GlassCard'
import { GlassButton } from '../ui/GlassButton'
import { GlassInput } from '../ui/GlassInput'
import { GlassSelect } from '../ui/GlassSelect'
import { X, Loader2, Save, RefreshCw, User, Briefcase, Building2, Key, Hash, ShieldCheck, Share2, Copy, Mail } from 'lucide-react'
import { supabase, studentSupabase } from '../../config/supabase'
import { grievanceCategories, hostels } from '../../data/grievanceData'
import { useToast } from '../../contexts/ToastContext'

interface StaffData {
    id?: string
    name: string
    role: string
    department: string
    staff_id: string
    password?: string
}

interface StaffFormProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialData?: StaffData | null
}

const StaffForm: React.FC<StaffFormProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
    const [loading, setLoading] = useState(false)
    const toast = useToast()
    const [showShareOptions, setShowShareOptions] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        department: '',
        staff_id: '',
        password: ''
    })

    const [hostelJobType, setHostelJobType] = useState('')
    const [selectedHostel, setSelectedHostel] = useState('')

    useEffect(() => {
        if (formData.department === 'Hostel') {
            if (hostelJobType === 'Hostel Superintendent') {
                setFormData(prev => ({ ...prev, role: 'Hostel Superintendent' }))
            } else if (hostelJobType === 'Warden' && selectedHostel) {
                setFormData(prev => ({ ...prev, role: `Warden (${selectedHostel})` }))
            }
        }
    }, [hostelJobType, selectedHostel, formData.department])

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                role: initialData.role,
                department: initialData.department,
                staff_id: initialData.staff_id,
                password: initialData.password || ''
            })

            // If editing and department is Hostel, try to parse role back to state
            if (initialData.department === 'Hostel') {
                if (initialData.role === 'Hostel Superintendent') {
                    setHostelJobType('Hostel Superintendent')
                } else if (initialData.role.startsWith('Warden (')) {
                    setHostelJobType('Warden')
                    // Extract hostel name "Warden (Boys Hostel 1)" -> "Boys Hostel 1"
                    const match = initialData.role.match(/Warden \((.*)\)/)
                    if (match && match[1]) {
                        setSelectedHostel(match[1])
                    }
                }
            }
        } else {
            generateCredentials()
        }
    }, [initialData, isOpen])

    const generateCredentials = () => {
        const randomId = 'EMP' + Math.floor(1000 + Math.random() * 9000)
        const randomPass = Math.random().toString(36).slice(-8)
        setFormData(prev => ({
            ...prev,
            staff_id: randomId,
            password: randomPass
        }))
    }

    const handleShare = async () => {
        const message = `Official GIET Staff Credentials\n\nName: ${formData.name}\nStaff ID: ${formData.staff_id}\nPassword: ${formData.password}\n\nPlease keep these credentials secure.`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Staff Credentials',
                    text: message,
                })
                return
            } catch (err) {
                if ((err as Error).name === 'AbortError') return
            }
        }
        
        // Toggle custom options menu for web browsers without native share
        setShowShareOptions(!showShareOptions)
    }

    const copyToClipboard = () => {
        const message = `Official GIET Staff Credentials\n\nName: ${formData.name}\nStaff ID: ${formData.staff_id}\nPassword: ${formData.password}`
        navigator.clipboard.writeText(message)
        toast.success("Credentials copied for sharing")
        setShowShareOptions(false)
    }

    const shareByEmail = () => {
        const subject = encodeURIComponent("GIET Staff Account Credentials")
        const body = encodeURIComponent(`Hello ${formData.name},\n\nYour account has been created. Here are your credentials:\n\nStaff ID: ${formData.staff_id}\nPassword: ${formData.password}\n\nPlease update your password after logging in.`)
        window.location.href = `mailto:?subject=${subject}&body=${body}`
        setShowShareOptions(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (initialData) {
                const { error } = await supabase
                    .from('staff')
                    .update({
                        name: formData.name,
                        role: formData.role,
                        department: formData.department,
                        password: formData.password
                    })
                    .eq('id', initialData.id);

                if (error) throw error;

                // SYNC TO STUDENT DB
                await studentSupabase
                    .from('staff_profiles')
                    .upsert({
                        id: initialData.id,
                        name: formData.name,
                        role: formData.role,
                        department: formData.department,
                        staff_id_code: formData.staff_id,
                        hostel_assigned: formData.department === 'Hostel' ? selectedHostel : null
                    });
            } else {
                const { data, error } = await supabase
                    .from('staff')
                    .insert([{
                        name: formData.name,
                        role: formData.role,
                        department: formData.department,
                        staff_id: formData.staff_id,
                        password: formData.password,
                        status: 'active'
                    }])
                    .select()
                    .single();

                if (error) throw error;

                // SYNC TO STUDENT DB
                if (data) {
                    await studentSupabase
                        .from('staff_profiles')
                        .insert([{
                            id: data.id,
                            name: formData.name,
                            role: formData.role,
                            department: formData.department,
                            staff_id_code: formData.staff_id,
                            hostel_assigned: formData.department === 'Hostel' ? selectedHostel : null
                        }]);
                }
            }
            toast.success(`Staff member ${initialData ? 'updated' : 'added'} successfully`)
            onSuccess()
            onClose()
        } catch (error) {
            console.error("Error saving staff:", error)
            toast.error("Failed to save staff details")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-3xl border-white/60 bg-white/95 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden rounded-2xl">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-teal-600 px-8 py-6 text-white text-center">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>

                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <h2 className="text-2xl font-bold tracking-tight">
                        {initialData ? 'Edit Staff Profile' : 'New Staff Onboarding'}
                    </h2>
                    <p className="mt-1 text-cyan-100">
                        {initialData ? 'Update staff details and permissions' : 'Create credentials for a new staff member'}
                    </p>
                </div>

                <GlassCardContent className="p-0">
                    <form onSubmit={handleSubmit}>
                        <div className="p-8 space-y-8">

                            {/* Section 1: Professional Info */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    <ShieldCheck className="h-4 w-4" /> Professional Details
                                </h3>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2 col-span-2 md:col-span-1">
                                        <label className="text-sm font-semibold text-slate-700">Department</label>
                                        <div className="relative group">
                                            <GlassSelect
                                                icon={Building2}
                                                options={grievanceCategories.map(c => ({ value: c.name, label: c.name }))}
                                                value={formData.department}
                                                onChange={(val) => setFormData({ ...formData, department: val })}
                                                placeholder="Select Department"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 col-span-2 md:col-span-1">
                                        <label className="text-sm font-semibold text-slate-700">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                                            <GlassInput
                                                required
                                                placeholder="Enter full name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="h-12 pl-10 border-slate-100 bg-slate-50 focus:bg-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Dynamic Role Section */}
                                    <div className="col-span-2 bg-slate-50/50 rounded-xl p-4 border border-slate-100 transition-all">
                                        {formData.department === 'Hostel' ? (
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Hostel Allocation</label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="relative">
                                                        <GlassSelect
                                                            options={[
                                                                { value: 'Hostel Superintendent', label: 'Superintendent' },
                                                                { value: 'Warden', label: 'Warden' }
                                                            ]}
                                                            value={hostelJobType}
                                                            onChange={(val) => setHostelJobType(val)}
                                                            placeholder="Select Role Type"
                                                        />
                                                    </div>

                                                    {hostelJobType === 'Warden' && (
                                                        <div className="relative animate-in fade-in slide-in-from-left-4 duration-300">
                                                            <GlassSelect
                                                                options={hostels.map(h => ({ value: h, label: h }))}
                                                                value={selectedHostel}
                                                                onChange={(val) => setSelectedHostel(val)}
                                                                placeholder="Select Hostel Building"
                                                                className="border-cyan-100 bg-cyan-50/50 text-cyan-900"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Staff Role / Designation</label>
                                                <div className="relative group">
                                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                                                    <GlassInput
                                                        required
                                                        placeholder="e.g. Senior Technician"
                                                        value={formData.role}
                                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                        className="h-12 pl-10 border-white bg-white shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Credentials */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    <Key className="h-4 w-4" /> Account Access
                                </h3>

                                <div className="grid gap-6 md:grid-cols-2 rounded-2xl bg-slate-900/5 p-6 border border-slate-200/50 relative">
                                    <div className="absolute top-4 right-4 flex flex-col items-end">
                                        <GlassButton
                                            type="button"
                                            onClick={handleShare}
                                            variant="outline"
                                            className="h-8 px-3 text-[10px] font-bold border-cyan-200 text-cyan-700 bg-white hover:bg-cyan-50 shadow-sm"
                                        >
                                            <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share Details
                                        </GlassButton>

                                        {/* Web Share Options Dropdown */}
                                        {showShareOptions && (
                                            <div className="absolute top-10 right-0 z-[100] w-48 bg-white rounded-xl shadow-2xl border border-slate-100 p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <button
                                                    type="button"
                                                    onClick={copyToClipboard}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <Copy className="h-4 w-4 text-cyan-600" /> Copy All Details
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={shareByEmail}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <Mail className="h-4 w-4 text-emerald-600" /> Send via Email
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-slate-700">Staff ID</label>
                                            {!initialData && (
                                                <span className="text-[10px] uppercase font-bold text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded-full">Auto-Generated</span>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                            <GlassInput
                                                required
                                                value={formData.staff_id}
                                                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                                                className={`h-12 pl-10 font-mono tracking-wide ${!initialData ? 'bg-white border-slate-200 pr-12' : 'bg-slate-200/50 text-slate-500 cursor-not-allowed border-transparent'}`}
                                                readOnly={!!initialData}
                                            />
                                            {!initialData && (
                                                <button
                                                    type="button"
                                                    onClick={generateCredentials}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                                                    title="Regenerate ID"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-slate-700">Access Password</label>
                                            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Confidential</span>
                                        </div>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                            <GlassInput
                                                value={formData.password}
                                                readOnly
                                                className="h-12 pl-10 font-mono text-slate-600 bg-slate-100/80 cursor-copy border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="border-t border-slate-100 bg-slate-50 p-6 flex justify-end gap-3 rounded-b-2xl">
                            <GlassButton
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="h-12 px-8 border-slate-200 hover:bg-white hover:text-slate-800"
                            >
                                Cancel
                            </GlassButton>
                            <GlassButton
                                type="submit"
                                disabled={loading}
                                className="h-12 px-8 bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all"
                            >
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                {initialData ? 'Update Profile' : 'Create Staff Member'}
                            </GlassButton>
                        </div>
                    </form>
                </GlassCardContent>
            </GlassCard>
        </div>,
        document.body
    )
}

export default StaffForm
