import EscalationSection from '../components/management/EscalationSection'
import { PageTransition, StaggerItem } from '../components/ui/PageTransition'

const EscalationManagement = () => {
    return (
        <PageTransition className="flex flex-col gap-6">
            <StaggerItem>
                <EscalationSection />
            </StaggerItem>
        </PageTransition>
    )
}

export default EscalationManagement