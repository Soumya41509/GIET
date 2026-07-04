import DepartmentSection from '../components/management/DepartmentSection'
import { PageTransition, StaggerItem } from '../components/ui/PageTransition'

const DepartmentManagement = () => {
    return (
        <PageTransition className="flex flex-col gap-6">
            <StaggerItem>
                <DepartmentSection />
            </StaggerItem>
        </PageTransition>
    )
}

export default DepartmentManagement