import { useLocation, useOutlet } from 'react-router-dom'
import { Suspense } from 'react'
import { GlassSidebar } from './GlassSidebar'
import { ContentLoader } from '../ui/ContentLoader'
import { AnimatePresence } from 'framer-motion'

const MainLayout = () => {
    const location = useLocation()
    const element = useOutlet()

    return (
        <div className="min-h-screen">
            <GlassSidebar />

            <main className="ml-64 3xl:ml-80 min-h-screen">
                <div className="p-6 2xl:p-10 3xl:p-12 mx-auto max-w-screen-2xl 3xl:max-w-[2400px]">
                    <Suspense fallback={<ContentLoader />}>
                        <AnimatePresence mode="wait">
                            <div key={location.pathname} className="w-full h-full">
                                {element}
                            </div>
                        </AnimatePresence>
                    </Suspense>
                </div>
            </main>
        </div>
    )
}

export { MainLayout }
