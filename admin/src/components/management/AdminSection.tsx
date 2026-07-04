import { useState, useEffect, useCallback } from 'react'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '../ui/GlassCard'
import { GlassButton } from '../ui/GlassButton'
import { Plus, Search, ShieldCheck, Edit2, Power, Trash2 } from 'lucide-react'
import { GlassInput } from '../ui/GlassInput'
import { supabase } from '../../config/supabase'
import AdminForm from './AdminForm'
import { GlassModal } from '../ui/GlassModal'
import { AdminSectionSkeleton } from '../ui/SkeletonLoader'
import { useToast } from '../../contexts/ToastContext'

const PROTECTED_EMAILS = ['sranjan41509@gmail.com']

interface Admin {
    id: string // This will be the email for Admins table
    name: string
    email: string
    role: 'super_admin' | 'admin'
    status: 'active' | 'disabled'
}

interface DBAdmin {
    name: string
    email: string
    role: 'super_admin' | 'admin'
    status: 'active' | 'disabled'

}
// SWR Global Cache for Instant Tab Switching
const adminCache = {
    data: [] as Admin[],
    isWarmedUp: false
}

const AdminSection = () => {
    const [adminList, setAdminList] = useState<Admin[]>(adminCache.data)
    const [searchTerm, setSearchTerm] = useState('')
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [adminToToggle, setAdminToToggle] = useState<Admin | null>(null)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null)
    const [loading, setLoading] = useState(!adminCache.isWarmedUp)
    const [isFetching, setIsFetching] = useState(false)
    const toast = useToast()

    const fetchAdmins = useCallback(async (isSilent = false) => {
        if (!isSilent && !adminCache.isWarmedUp) setLoading(true)
        else if (!isSilent) setIsFetching(true)
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            // Map Supabase data to our interface. Note: 'email' is the primary key in our SQL, so we can use it as ID.
            const admins = data.map((admin: DBAdmin) => ({
                id: admin.email, // Use email as ID for frontend consistency
                ...admin
            }));
            setAdminList(admins);
            adminCache.data = admins
            adminCache.isWarmedUp = true
        }
        if (error) console.error("Error fetching admins:", error);
        setLoading(false);
        setIsFetching(false)
    }, []);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    useEffect(() => {
        const subscription = supabase
            .channel('admins_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admins' }, (payload) => {
                // Map DB payload to frontend structure (id = email)
                const newAdmin = { ...payload.new, id: payload.new.email } as Admin
                setAdminList(prev => [newAdmin, ...prev])
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'admins' }, (payload) => {
                const updatedAdmin = { ...payload.new, id: payload.new.email } as Admin
                setAdminList(prev => prev.map(admin =>
                    admin.email === updatedAdmin.email ? updatedAdmin : admin
                ))
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'admins' }, (payload) => {
                if (payload.old.email) {
                    setAdminList(prev => prev.filter(admin => admin.email !== payload.old.email))
                } else if (payload.old.id) {
                    // Try to remove by UUID if available (but our local list 'id' is email)
                    // This is tricky. Let's trigger a refetch for DELETE to be 100% safe.
                    // OR, if the row is gone, we can't map it easily.
                    fetchAdmins(true)
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        }
    }, [fetchAdmins])

    const handleEdit = (admin: Admin) => {
        setEditingAdmin(admin)
        setIsFormOpen(true)
    }

    const handleToggleStatus = (admin: Admin) => {
        if (admin.role === 'super_admin' || PROTECTED_EMAILS.includes(admin.email)) {
            toast.warning("This admin account is protected and cannot be disabled.");
            return;
        }
        setAdminToToggle(admin)
        setIsConfirmModalOpen(true)
    }

    const confirmToggleStatus = async () => {
        if (!adminToToggle) return

        try {
            const newStatus = adminToToggle.status === 'active' ? 'disabled' : 'active'
            const { error } = await supabase
                .from('admins')
                .update({ status: newStatus })
                .eq('email', adminToToggle.email);

            if (error) throw error;

            // Update local state immediately
            setAdminList(prev => prev.map(admin =>
                admin.email === adminToToggle.email
                    ? { ...admin, status: newStatus }
                    : admin
            ));

            toast.success(`Admin ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`)

        } catch (error) {
            console.error("Error updating status:", error)
        } finally {
            setIsConfirmModalOpen(false)
            setAdminToToggle(null)
        }
    }

    const handleDelete = (admin: Admin) => {
        if (admin.role === 'super_admin' || PROTECTED_EMAILS.includes(admin.email)) {
            toast.warning("This admin account is protected and cannot be deleted.");
            return;
        }
        if (admin.status !== 'disabled') {
            toast.warning("Only disabled admins can be deleted.");
            return;
        }
        setAdminToDelete(admin)
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!adminToDelete) return

        try {
            const { error } = await supabase
                .from('admins')
                .delete()
                .eq('email', adminToDelete.email);

            if (error) throw error;

            // Update local state immediately
            setAdminList(prev => prev.filter(admin => admin.email !== adminToDelete.email));
            toast.success("Admin deleted successfully")

        } catch (error) {
            console.error("Error deleting admin:", error)
        } finally {
            setIsDeleteModalOpen(false)
            setAdminToDelete(null)
        }
    }

    const filteredAdmins = adminList.filter(admin =>
        admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {loading ? (
                <AdminSectionSkeleton />
            ) : (
                <GlassCard className={`flex-1 flex flex-col min-h-0 overflow-hidden shadow-xl shadow-cyan-900/5 border-white/60 bg-white/40 backdrop-blur-xl transition-opacity duration-300 ${isFetching ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                    <GlassCardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/20 pb-4 3xl:pb-6 relative">
                        {isFetching && !loading && (
                            <div className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden rounded-t-3xl">
                                <div className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 w-full animate-[progress_1s_ease-in-out_infinite]"></div>
                            </div>
                        )}
                        <GlassCardTitle className="3xl:text-2xl text-slate-800">Admin List</GlassCardTitle>
                        <GlassButton onClick={() => { setEditingAdmin(null); setIsFormOpen(true) }} className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white 3xl:px-6 3xl:py-3 3xl:text-base rounded-full shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95">
                            <Plus className="mr-2 h-4 w-4 3xl:h-5 3xl:w-5" /> Add Admin
                        </GlassButton>
                    </GlassCardHeader>
                    <GlassCardContent className="flex-1 flex flex-col min-h-0 overflow-hidden p-0">
                        <div className="p-4 3xl:p-6 border-b border-white/10">
                            <div className="relative max-w-sm 3xl:max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 3xl:h-5 3xl:w-5 -translate-y-1/2 text-slate-400" />
                                <GlassInput
                                    placeholder="Search admins..."
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
                                        <th className="p-4 3xl:p-6 font-bold uppercase tracking-wider text-xs 3xl:text-sm pl-6 3xl:pl-8">Name</th>
                                        <th className="p-4 3xl:p-6 font-bold uppercase tracking-wider text-xs 3xl:text-sm">Email</th>
                                        <th className="p-4 3xl:p-6 font-bold uppercase tracking-wider text-xs 3xl:text-sm">Role</th>
                                        <th className="p-4 3xl:p-6 font-bold uppercase tracking-wider text-xs 3xl:text-sm">Status</th>
                                        <th className="p-4 3xl:p-6 font-bold uppercase tracking-wider text-xs 3xl:text-sm text-right pr-6 3xl:pr-8">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredAdmins.map((admin) => (
                                        <tr key={admin.id} className="hover:bg-white/30 transition-colors group">
                                            <td className="p-4 3xl:p-6 font-semibold text-slate-800 pl-6 3xl:pl-8">{admin.name}</td>
                                            <td className="p-4 3xl:p-6 text-slate-600 font-mono text-xs 3xl:text-sm">{admin.email}</td>
                                            <td className="p-4 3xl:p-6">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 3xl:px-4 3xl:py-1.5 text-xs 3xl:text-sm font-medium border ${admin.role === 'super_admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}>
                                                    <ShieldCheck className="h-3 w-3 3xl:h-4 3xl:w-4" />
                                                    {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                                </span>
                                            </td>
                                            <td className="p-4 3xl:p-6">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 3xl:px-4 3xl:py-1.5 text-xs 3xl:text-sm font-medium border ${admin.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                    {admin.status}
                                                </span>
                                            </td>
                                            <td className="p-4 3xl:p-6 text-right pr-6 3xl:pr-8">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleEdit(admin)} className="group/btn p-2 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all" title="Edit">
                                                        <Edit2 className="h-4 w-4 3xl:h-5 3xl:w-5 group-hover/btn:scale-110 transition-transform" />
                                                    </button>
                                                    {admin.role !== 'super_admin' && (
                                                        <>
                                                            <button onClick={() => handleToggleStatus(admin)} className={`group/btn p-2 rounded-full hover:bg-slate-50 transition-all ${admin.status === 'active' ? 'text-slate-400 hover:text-orange-500' : 'text-slate-400 hover:text-green-500'}`} title={admin.status === 'active' ? 'Disable' : 'Enable'}>
                                                                <Power className="h-4 w-4 3xl:h-5 3xl:w-5 group-hover/btn:scale-110 transition-transform" />
                                                            </button>
                                                            {admin.status === 'disabled' && (
                                                                <button onClick={() => handleDelete(admin)} className="group/btn p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all" title="Delete">
                                                                    <Trash2 className="h-4 w-4 3xl:h-5 3xl:w-5 group-hover/btn:scale-110 transition-transform" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAdmins.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-500 3xl:p-12 3xl:text-lg">
                                                No admins found.
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
                <AdminForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={() => fetchAdmins(true)}
                    initialData={editingAdmin}
                    isRoleLocked={editingAdmin ? PROTECTED_EMAILS.includes(editingAdmin.email) : false}
                />
            )}

            <GlassModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title={`Confirm ${adminToToggle?.status === 'active' ? 'Disable' : 'Enable'} Admin`}
            >
                <div className="space-y-6">
                    <p className="text-2xl font-medium text-slate-700 leading-relaxed">
                        Are you sure you want to {adminToToggle?.status === 'active' ? 'disable' : 'enable'} <strong>{adminToToggle?.name}</strong>?
                        {adminToToggle?.status === 'active' && " They will lose access to the admin panel."}
                    </p>
                    <div className="flex justify-end gap-3">
                        <GlassButton
                            variant="secondary"
                            onClick={() => setIsConfirmModalOpen(false)}
                        >
                            Cancel
                        </GlassButton>
                        <GlassButton
                            variant={adminToToggle?.status === 'active' ? 'destructive' : 'primary'}
                            onClick={confirmToggleStatus}
                        >
                            {adminToToggle?.status === 'active' ? 'Disable' : 'Enable'}
                        </GlassButton>
                    </div>
                </div>
            </GlassModal>

            <GlassModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Delete Admin"
            >
                <div className="space-y-6">
                    <p className="text-2xl font-medium text-slate-700 leading-relaxed">
                        Are you sure you want to permanently delete <strong>{adminToDelete?.name}</strong>?
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

export default AdminSection
