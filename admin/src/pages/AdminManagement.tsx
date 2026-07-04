import AdminSection from '../components/management/AdminSection.tsx'
import { PageTransition, StaggerItem } from '../components/ui/PageTransition'
import { useAuth } from '../contexts/AuthContext'

const AdminManagement = () => {
    const { role } = useAuth()
    
    if (role !== 'super_admin') {
        return (
            <div className="flex h-[calc(100vh-120px)] items-center justify-center">
                <div className="p-10 text-center bg-white/40 rounded-3xl border border-red-100 backdrop-blur-xl text-red-500 font-bold">
                    Access Denied: Super Admin Privileges Required
                </div>
            </div>
        )
    }

    return (
        <PageTransition className="flex flex-col gap-6">
            <StaggerItem>
                <AdminSection />
            </StaggerItem>
        </PageTransition>
    )
}

export default AdminManagement