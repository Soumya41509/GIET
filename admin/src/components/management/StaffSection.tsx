import { useState, useEffect } from 'react'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '../ui/GlassCard'
import { GlassButton } from '../ui/GlassButton'
import { Plus, Search, FileSpreadsheet, FileText, Edit2, Power, Trash2 } from 'lucide-react'
import { GlassInput } from '../ui/GlassInput'
import { GlassModal } from '../ui/GlassModal'
import { supabase, studentSupabase } from '../../config/supabase'
import StaffForm from './StaffForm.tsx'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { AdminSectionSkeleton } from '../ui/SkeletonLoader'
import { useToast } from '../../contexts/ToastContext'

interface Staff {
    id: string
    name: string
    role: string
    staff_id: string
    department: string
    status: 'active' | 'disabled'
    password?: string
}
// SWR Global Cache for Instant Tab Switching
const staffCache = {
    data: [] as Staff[],
    isWarmedUp: false
}

const StaffSection = () => {
    const [staffList, setStaffList] = useState<Staff[]>(staffCache.data)
    const [searchTerm, setSearchTerm] = useState('')
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
    const [loading, setLoading] = useState(!staffCache.isWarmedUp)
    const [isFetching, setIsFetching] = useState(false)
    const toast = useToast()
    const fetchStaff = async (isSilent = false) => {
        if (!isSilent && !staffCache.isWarmedUp) setLoading(true)
        else if (!isSilent) setIsFetching(true)

        try {
            const { data, error } = await supabase
                .from('staff')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                const results = data as Staff[]
                setStaffList(results);
                staffCache.data = results
                staffCache.isWarmedUp = true
            }
            if (error) console.error("Error fetching staff:", error);
        } finally {
            setLoading(false)
            setIsFetching(false)
        }
    };

    useEffect(() => {
        fetchStaff();

        // Realtime subscription with granular updates
        const subscription = supabase
            .channel('staff_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'staff' }, (payload) => {
                const newStaff = payload.new as Staff
                setStaffList(prev => [newStaff, ...prev])
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'staff' }, (payload) => {
                const updatedStaff = payload.new as Staff
                setStaffList(prev => prev.map(staff =>
                    staff.id === updatedStaff.id ? updatedStaff : staff
                ))
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'staff' }, (payload) => {
                setStaffList(prev => prev.filter(staff => staff.id !== payload.old.id))
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        }
    }, [])

    const handleEdit = (staff: Staff) => {
        setEditingStaff(staff)
        setIsFormOpen(true)
    }

    const handleToggleStatus = async (staff: Staff) => {
        const newStatus = staff.status === 'active' ? 'disabled' : 'active'

        // Optimistic update
        setStaffList(prev => prev.map(s =>
            s.id === staff.id ? { ...s, status: newStatus } : s
        ))

        try {
            const { error } = await supabase
                .from('staff')
                .update({ status: newStatus })
                .eq('id', staff.id);

            if (error) throw error
            toast.success(`Staff member ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`)
        } catch (error) {
            console.error("Error updating status:", error)
            // Revert on error
            setStaffList(prev => prev.map(s =>
                s.id === staff.id ? { ...s, status: staff.status } : s
            ))
            toast.error("Failed to update status")
        }
    }

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null)

    const handleDelete = (staff: Staff) => {
        if (staff.status !== 'disabled') {
            toast.warning("Only disabled staff can be deleted.");
            return;
        }
        setStaffToDelete(staff)
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!staffToDelete) return

        try {
            const { error } = await supabase
                .from('staff')
                .delete()
                .eq('id', staffToDelete.id);

            if (error) throw error;

            // SYNC DELETE TO STUDENT DB
            await studentSupabase
                .from('staff_profiles')
                .delete()
                .eq('id', staffToDelete.id);

            // Update local state immediately
            setStaffList(prev => prev.filter(staff => staff.id !== staffToDelete.id));
            toast.success("Staff member deleted successfully")

        } catch (error) {
            console.error("Error deleting staff:", error)
        } finally {
            setIsDeleteModalOpen(false)
            setStaffToDelete(null)
        }
    }

    const exportToExcel = () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const ws = XLSX.utils.json_to_sheet(staffList.map(({ id, ...rest }) => rest))
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Staff")
        XLSX.writeFile(wb, "staff_list.xlsx")
    }

    const exportToPDF = () => {
        const doc = new jsPDF()
        autoTable(doc, {
            head: [['Name', 'ID', 'Role', 'Department', 'Status']],
            body: staffList.map(s => [s.name, s.staff_id, s.role, s.department, s.status]),
        })
        doc.save('staff_list.pdf')
    }

    const filteredStaff = staffList.filter(staff =>
        staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.staff_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.department?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {loading ? (
                <AdminSectionSkeleton /> // Using AdminSectionSkeleton as a generic loader
            ) : (
                <GlassCard className={`flex-1 flex flex-col min-h-0 overflow-hidden shadow-xl shadow-cyan-900/5 border-white/60 bg-white/40 backdrop-blur-xl transition-opacity duration-300 ${isFetching ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                    <GlassCardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/20 pb-4 3xl:pb-6 relative">
                        {isFetching && !loading && (
                            <div className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden rounded-t-3xl">
                                <div className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 w-full animate-[progress_1s_ease-in-out_infinite]"></div>
                            </div>
                        )}
                        <GlassCardTitle className="3xl:text-2xl text-slate-800">Staff List</GlassCardTitle>
                        <div className="flex flex-wrap gap-2">
                            <GlassButton onClick={() => { setEditingStaff(null); setIsFormOpen(true) }} className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white 3xl:px-6 3xl:py-3 3xl:text-base rounded-full shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95">
                                <Plus className="mr-2 h-4 w-4 3xl:h-5 3xl:w-5" /> Add Staff
                            </GlassButton>
                            <GlassButton onClick={exportToExcel} variant="outline" className="bg-white/50 3xl:px-6 3xl:py-3 3xl:text-base rounded-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300">
                                <FileSpreadsheet className="mr-2 h-4 w-4 3xl:h-5 3xl:w-5" /> Excel
                            </GlassButton>
                            <GlassButton onClick={exportToPDF} variant="outline" className="bg-white/50 3xl:px-6 3xl:py-3 3xl:text-base rounded-full border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300">
                                <FileText className="mr-2 h-4 w-4 3xl:h-5 3xl:w-5" /> PDF
                            </GlassButton>
                        </div>
                    </GlassCardHeader>
                    <GlassCardContent className="flex-1 flex flex-col min-h-0 overflow-hidden p-0">
                        <div className="p-4 3xl:p-6 border-b border-white/10">
                            <div className="relative max-w-sm 3xl:max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 3xl:h-5 3xl:w-5 -translate-y-1/2 text-slate-400" />
                                <GlassInput
                                    placeholder="Search staff..."
                                    className="pl-10 bg-white/50 3xl:py-3 3xl:text-base 3xl:pl-12 border-white/40 focus:bg-white/80 transition-all rounded-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm 3xl:text-base">
                                <thead className="bg-white/50 text-slate-600 border-b border-white/20">
                                    <tr>
                                        <th className="p-4 3xl:p-6 font-bold uppercase tracking-wider text-xs 3xl:text-sm pl-6 3xl:pl-8">Staff ID</th>
                                        <th className="p-4 3xl:p-6 font-bold uppercase tracking-wider text-xs 3xl:text-sm">Name</th>
                                        <th className="p-4 3xl:p-6 font-bold uppercase tracking-wider text-xs 3xl:text-sm">Role</th>
                                        <th className="p-4 3xl:p-6 font-bold uppercase tracking-wider text-xs 3xl:text-sm">Department</th>
                                        <th className="p-4 3xl:p-6 font-bold uppercase tracking-wider text-xs 3xl:text-sm">Status</th>
                                        <th className="p-4 3xl:p-6 font-bold uppercase tracking-wider text-xs 3xl:text-sm text-right pr-6 3xl:pr-8">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredStaff.map((staff) => (
                                        <tr key={staff.id} className="hover:bg-white/30 transition-colors group">
                                            <td className="p-4 3xl:p-6 font-mono font-medium text-slate-500 pl-6 3xl:pl-8">{staff.staff_id}</td>
                                            <td className="p-4 3xl:p-6 font-semibold text-slate-800">{staff.name}</td>
                                            <td className="p-4 3xl:p-6 text-slate-600">{staff.role}</td>
                                            <td className="p-4 3xl:p-6 text-slate-600">{staff.department}</td>
                                            <td className="p-4 3xl:p-6">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 3xl:px-4 3xl:py-1.5 text-xs 3xl:text-sm font-medium border ${staff.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                    {staff.status}
                                                </span>
                                            </td>
                                            <td className="p-4 3xl:p-6 text-right pr-6 3xl:pr-8">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleEdit(staff)} className="group/btn p-2 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all" title="Edit">
                                                        <Edit2 className="h-4 w-4 3xl:h-5 3xl:w-5 group-hover/btn:scale-110 transition-transform" />
                                                    </button>
                                                    <button onClick={() => handleToggleStatus(staff)} className={`group/btn p-2 rounded-full hover:bg-slate-50 transition-all ${staff.status === 'active' ? 'text-slate-400 hover:text-orange-500' : 'text-slate-400 hover:text-green-500'}`} title={staff.status === 'active' ? 'Disable' : 'Enable'}>
                                                        <Power className="h-4 w-4 3xl:h-5 3xl:w-5 group-hover/btn:scale-110 transition-transform" />
                                                    </button>
                                                    {staff.status === 'disabled' && (
                                                        <button onClick={() => handleDelete(staff)} className="group/btn p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all" title="Delete">
                                                            <Trash2 className="h-4 w-4 3xl:h-5 3xl:w-5 group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStaff.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-500 3xl:p-12 3xl:text-lg">
                                                No staff members found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </GlassCardContent>
                </GlassCard>
            )}

            {isFormOpen && (
                <StaffForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={() => fetchStaff(true)}
                    initialData={editingStaff}
                />
            )}

            <GlassModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Delete Staff"
            >
                <div className="space-y-6">
                    <p className="text-2xl font-medium text-slate-700 leading-relaxed">
                        Are you sure you want to permanently delete <strong>{staffToDelete?.name}</strong>?
                        <span className="block mt-2 text-base text-red-600">This action cannot be undone.</span>
                    </p>
                    <div className="flex justify-end gap-3">
                        <GlassButton
                            variant="secondary"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Cancel
                        </GlassButton>
                        <GlassButton
                            variant="destructive"
                            onClick={confirmDelete}
                        >
                            Delete Permanently
                        </GlassButton>
                    </div>
                </div>
            </GlassModal>
        </div>
    )
}

export default StaffSection
