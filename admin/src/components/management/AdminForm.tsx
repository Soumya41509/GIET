import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GlassCard, GlassCardContent } from '../ui/GlassCard'
import { GlassButton } from '../ui/GlassButton'
import { GlassInput } from '../ui/GlassInput'
import { GlassSelect } from '../ui/GlassSelect'
import { X, Loader2, Save, User, Mail, ShieldCheck, Lock } from 'lucide-react'
import { supabase } from '../../config/supabase'
import { useToast } from '../../contexts/ToastContext'

interface AdminData {
    name: string
    email: string
    role: string
}

interface AdminFormProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialData?: AdminData | null
    isRoleLocked?: boolean
}

const AdminForm: React.FC<AdminFormProps> = ({ isOpen, onClose, onSuccess, initialData, isRoleLocked = false }) => {
    const [loading, setLoading] = useState(false)
    const toast = useToast()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'admin',
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                email: initialData.email,
                role: initialData.role,
            })
        } else {
            setFormData({
                name: '',
                email: '',
                role: 'admin',
            })
        }
    }, [initialData, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const emailId = formData.email.toLowerCase().trim()

            if (initialData) {
                const { error } = await supabase
                    .from('admins')
                    .update({
                        name: formData.name,
                        role: formData.role,
                    })
                    .eq('email', initialData.email);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('admins')
                    .insert([{
                        name: formData.name,
                        email: emailId,
                        role: formData.role,
                        status: 'active'
                    }]);

                if (error) throw error;
            }
            toast.success(`Admin ${initialData ? 'updated' : 'added'} successfully`);
            onSuccess()
            onClose()
        } catch (error) {
            console.error("Error saving admin:", error)
            toast.error("Failed to save admin details")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-2xl border-white/60 bg-white/95 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden rounded-2xl">
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
                        {initialData ? 'Edit Administrator' : 'New Administrator'}
                    </h2>
                    <p className="mt-1 text-cyan-100">
                        {initialData ? 'Update admin privileges and details' : 'Grant access to a new administrator'}
                    </p>
                </div>

                <GlassCardContent className="p-0">
                    <form onSubmit={handleSubmit}>
                        <div className="p-8 space-y-8">

                            {/* Section: Admin Info */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    <User className="h-4 w-4" /> Personal Details
                                </h3>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2 md:col-span-2">
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

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-slate-700">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                                            <GlassInput
                                                required
                                                type="email"
                                                placeholder="admin@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className={`h-12 pl-10 border-slate-100 ${initialData ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 focus:bg-white'}`}
                                                readOnly={!!initialData}
                                            />
                                            {initialData && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Permissions */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    <ShieldCheck className="h-4 w-4" /> Access Level
                                </h3>

                                <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Administrative Role</label>
                                        <div className="relative group">
                                            <GlassSelect
                                                icon={ShieldCheck}
                                                options={[
                                                    { value: 'admin', label: 'Admin (Standard Access)' },
                                                    { value: 'super_admin', label: 'Super Admin (Full Access)' }
                                                ]}
                                                value={formData.role}
                                                onChange={(val) => setFormData({ ...formData, role: val })}
                                                disabled={isRoleLocked}
                                            />
                                        </div>
                                        {isRoleLocked && (
                                            <p className="text-xs text-amber-600 mt-1.5 font-medium flex items-center gap-1">
                                                <Lock className="h-3 w-3" /> This role cannot be modified.
                                            </p>
                                        )}
                                        <p className="text-xs text-slate-500 mt-2 ml-1">
                                            {formData.role === 'super_admin'
                                                ? 'Super Admins have full control over system settings, can manage other admins, and delete records.'
                                                : 'Standard Admins can manage grievances and staff but cannot access system settings or manage other admins.'}
                                        </p>
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
                                {initialData ? 'Update Privileges' : 'Grant Access'}
                            </GlassButton>
                        </div>
                    </form>
                </GlassCardContent>
            </GlassCard>
        </div>,
        document.body
    )
}

export default AdminForm
