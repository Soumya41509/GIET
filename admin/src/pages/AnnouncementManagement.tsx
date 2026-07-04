import AnnouncementSection from '../components/management/AnnouncementSection'
import { PageTransition, StaggerItem } from '../components/ui/PageTransition'

const AnnouncementManagement = () => {
    return (
        <PageTransition className="flex flex-col gap-6">
            <StaggerItem>
                <AnnouncementSection />
            </StaggerItem>
        </PageTransition>
    )
}

export default AnnouncementManagement