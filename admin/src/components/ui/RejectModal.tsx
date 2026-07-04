import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GlassCard } from './GlassCard'
import { GlassButton } from './GlassButton'
import { X, Loader2, MessageSquare, Info, ShieldAlert } from 'lucide-react'

interface RejectModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string, template?: string) => Promise<void>
    grievanceId: string
    loading?: boolean
}

const REJECTION_TEMPLATES = [
    {
        id: 'out_of_scope',
        label: 'Out of Institutional Scope',
        reason: 'This grievance does not fall under institutional jurisdiction. Please contact the relevant external department for assistance.'
    },
    {
        id: 'insufficient_info',
        label: 'Insufficient Information',
        reason: 'The grievance lacks sufficient details for us to take action. Please submit a new grievance with complete information including dates, locations, and specific incidents.'
    },
    {
        id: 'duplicate',
        label: 'Duplicate Submission',
        reason: 'This grievance is a duplicate of a previously submitted case. Please refer to your original submission for updates.'
    },
    {
        id: 'inappropriate',
        label: 'Inappropriate Content',
        reason: 'This grievance contains inappropriate or offensive content that violates institutional guidelines. Please submit a new grievance with professional language.'
    },
    {
        id: 'resolved_already',
        label: 'Already Resolved',
        reason: 'This issue has already been resolved through other channels. If you believe this is incorrect, please contact the grievance office directly.'
    },
    {
        id: 'custom',
        label: 'Custom Reason',
        reason: ''
    }
]

export const RejectModal = ({ isOpen, onClose, onConfirm, grievanceId, loading = false }: RejectModalProps) => {
    const [selectedTemplate, setSelectedTemplate] = useState('custom')
    const [reasonText, setReasonText] = useState('')

    // Reset state when modal opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (isOpen) {
            setSelectedTemplate('custom')
            setReasonText('')
        }
    }, [isOpen])

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId)
        const template = REJECTION_TEMPLATES.find(t => t.id === templateId)
        if (template && template.id !== 'custom') {
            setReasonText(template.reason)
        } else {
            setReasonText('')
        }
    }

    const wordCount = reasonText.trim().split(/\s+/).filter(w => w.length > 0).length
    const isReasonValid = wordCount >= 10
    const charCount = reasonText.length
    const maxChars = 500

    const handleClose = () => {
        if (!loading) {
            onClose()
        }
    }

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isReasonValid && !loading) {
            await onConfirm(reasonText.trim(), selectedTemplate)
            handleClose()
        }
    }

    if (!isOpen) return null

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
            <GlassCard className="w-full max-w-2xl border-white/80 bg-white/90 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden rounded-2xl ring-1 ring-white/50">
                {/* Header with Red Gradient & Glass Effect */}
                <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-rose-600 px-8 py-6 text-white text-center border-b border-white/10">
                    {/* Decorative Blobs */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-3xl mix-blend-overlay"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-white/10 blur-3xl mix-blend-overlay"></div>
                    <div className="absolute top-1/2 left-1/4 h-20 w-20 rounded-full bg-orange-400/20 blur-2xl mix-blend-overlay"></div>

                    <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 rounded-full p-2 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200 hover:rotate-90"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md shadow-inner ring-1 ring-white/20">
                            <ShieldAlert className="h-8 w-8 text-white drop-shadow-md" />
                        </div>
                        <div>
                            <h2 className="text-xl 2xl:text-2xl font-bold tracking-tight text-white drop-shadow-sm">
                                Reject Grievance
                            </h2>
                            <p className="mt-2 text-red-50/90 text-xs font-mono bg-black/10 px-3 py-1 rounded-full inline-block border border-white/10">
                                ID: #{grievanceId}
                            </p>
                            <p className="mt-1 text-red-100/80 text-xs font-medium">
                                Action is irreversible
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white">
                    <form onSubmit={handleConfirm}>
                        <div className="p-6 space-y-5">
                            {/* Standard Reason Selection */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <Info className="h-3.5 w-3.5" /> Select Rejection Template
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {REJECTION_TEMPLATES.map((template) => (
                                        <button
                                            key={template.id}
                                            type="button"
                                            onClick={() => handleTemplateChange(template.id)}
                                            className={`relative flex items-center p-3 text-left rounded-xl border transition-all duration-200 group
                                            ${selectedTemplate === template.id
                                                    ? 'bg-red-50 border-red-200 shadow-sm ring-1 ring-red-500/20'
                                                    : 'bg-white border-slate-100 hover:border-red-100 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-full mr-3 shrink-0 transition-colors ${selectedTemplate === template.id ? 'bg-red-100/80 text-red-600' : 'bg-slate-50 text-slate-400 group-hover:text-red-400'}`}>
                                                {selectedTemplate === template.id ? <ShieldAlert className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current" />}
                                            </div>
                                            <div>
                                                <span className={`block text-xs font-bold uppercase tracking-wide ${selectedTemplate === template.id ? 'text-red-900' : 'text-slate-600'}`}>
                                                    {template.label === 'Custom Reason (Write your own)' ? 'Custom Reason' : template.label}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {template.id === 'custom' ? 'Write your own reason below' : 'Pre-defined template'}
                                                </span>
                                            </div>
                                            {selectedTemplate === template.id && (
                                                <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reason Textarea */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Justification <span className="text-red-500 ml-0.5">*</span>
                                </label>

                                <div className="space-y-2">
                                    <div className="relative">
                                        <textarea
                                            required
                                            value={reasonText}
                                            onChange={(e) => {
                                                if (e.target.value.length <= maxChars) setReasonText(e.target.value)
                                            }}
                                            placeholder="Provide a specific reason for rejection (min 10 words)..."
                                            className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm leading-relaxed text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:bg-slate-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 focus:bg-white resize-none shadow-inner"
                                        />
                                        <div className="absolute bottom-3 right-3 text-[10px] font-semibold tracking-wide py-1 px-2 rounded-md bg-white/50 border border-slate-100 shadow-sm text-slate-400">
                                            {charCount}/{maxChars} chars
                                        </div>
                                    </div>

                                    <div className={`text-xs pl-1 transition-colors duration-300 ${isReasonValid ? 'text-green-600 font-medium flex items-center gap-1' : 'text-slate-400'}`}>
                                        {isReasonValid && "✓ Valid reason provided"}
                                        {!isReasonValid && wordCount > 0 && `Keep typing... (${10 - wordCount} more words needed)`}
                                        {!isReasonValid && wordCount === 0 && "Minimum 10 words required"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="border-t border-slate-100 bg-slate-50/80 p-6 flex justify-end gap-3 rounded-b-2xl backdrop-blur-sm">
                            <GlassButton
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={loading}
                                className="h-11 px-6 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-300 shadow-sm"
                            >
                                Cancel
                            </GlassButton>
                            <GlassButton
                                type="submit"
                                disabled={!isReasonValid || loading}
                                className="h-11 px-8 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <X className="mr-2 h-4 w-4" />
                                        Confirm Rejection
                                    </>
                                )}
                            </GlassButton>
                        </div>
                    </form>
                </div>
            </GlassCard>
        </div>,
        document.body
    )
}
