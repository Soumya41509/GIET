import { useState, useEffect } from 'react'
import { History, Search, User, FileText, Zap } from 'lucide-react'
import { GlassCard, GlassCardContent } from '../ui/GlassCard'
import { GlassInput } from '../ui/GlassInput'
import { format } from 'date-fns'

const AuditLogSection = () => {
    const [logs, setLogs] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    // Mock audit logs - In a real app these fetched from 'admin_audit_logs' table
    useEffect(() => {
        setLogs([
            { id: 1, action: 'Updated Staff', target: 'John Doe', user: 'Super Admin', time: new Date(Date.now() - 1000 * 60 * 45).toISOString(), type: 'edit' },
            { id: 2, action: 'Updated Policy', target: 'SLA Change', user: 'Admin 1', time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), type: 'config' },
            { id: 3, action: 'Modified SLA', target: 'Academics Department', user: 'Super Admin', time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), type: 'config' },
            { id: 4, action: 'Status Update', target: 'G-12948', user: 'Staff Agent', time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), type: 'status' },
        ])
    }, [])

    const filteredLogs = logs.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <GlassCard className="border-white/60 bg-white/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
                <div className="p-8 border-b border-white/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl bg-white shadow-xl shadow-slate-200/50">
                            <History className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Audit Logs</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Operational History & Accountability</p>
                        </div>
                    </div>
                    
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <GlassInput 
                            placeholder="Filter audit trail..." 
                            className="pl-10 text-xs bg-white/60"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <GlassCardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Action</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Resource</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-indigo-50/10 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-800">{format(new Date(log.time), 'HH:mm')}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{format(new Date(log.time), 'dd MMM yyyy')}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{log.user}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    log.type === 'edit' ? 'bg-amber-400' :
                                                    log.type === 'bulk' ? 'bg-indigo-500' :
                                                    log.type === 'config' ? 'bg-teal-500' : 'bg-slate-400'
                                                }`} />
                                                <span className="text-sm font-black text-slate-900">{log.action}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                                                {log.target}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors group">
                                                <Zap className="w-4 h-4 text-slate-300 group-hover:text-amber-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCardContent>
            </GlassCard>
            
            <div className="flex items-center justify-center py-4 opacity-50">
                <FileText className="w-4 h-4 mr-2" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">End of recent audit trail</span>
            </div>
        </div>
    )
}

export default AuditLogSection