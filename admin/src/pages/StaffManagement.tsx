import StaffSection from '../components/management/StaffSection'
import { PageTransition, StaggerItem } from '../components/ui/PageTransition'

const StaffManagement = () => {
    return (
        <PageTransition className="flex flex-col gap-6">
            <StaggerItem>
                <StaffSection />
            </StaggerItem>
        </PageTransition>
    )
}

export default StaffManagement