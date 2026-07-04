import TipsSection from '../components/management/TipsSection'
import { PageTransition, StaggerItem } from '../components/ui/PageTransition'

const ManageTips = () => {
    return (
        <PageTransition className="flex flex-col gap-6">
            <StaggerItem>
                <TipsSection />
            </StaggerItem>
        </PageTransition>
    )
}

export default ManageTips
