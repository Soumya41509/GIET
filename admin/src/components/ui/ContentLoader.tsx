import { Skeleton } from './SkeletonLoader'

export const ContentLoader = () => {
    return (
        <div className="flex w-full h-[60vh] items-center justify-center p-8">
            <div className="w-full max-w-2xl space-y-4">
                <Skeleton className="h-10 w-48 mx-auto mb-8" />
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[200px] w-full" />
            </div>
        </div>
    )
}
