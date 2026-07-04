import { PageTransition, StaggerItem } from '../components/ui/PageTransition'
import Heatmap from '../components/reports/Heatmap'

const Reports = () => {
    return (
        <PageTransition>
            <StaggerItem>
                <Heatmap />
            </StaggerItem>
        </PageTransition>
    )
}

export default Reports