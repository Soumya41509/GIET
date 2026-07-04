import React from 'react'
import { GlassCard, GlassCardContent, GlassCardHeader } from './GlassCard'

interface SkeletonProps {
    className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
    return (
        <div className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`} />
    )
}

// Dashboard Skeleton
export const DashboardSkeleton = () => {
    return (
        <div className="space-y-6 w-full animate-in fade-in duration-500">
            {/* Top 4 + 2 Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 3xl:gap-8">
                {[1, 2, 3, 4].map((i) => (
                    <GlassCard key={i} className="border-white/60 bg-white/40 shadow-sm overflow-hidden relative">
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-slate-200/50 blur-2xl flex-none" />
                        <GlassCardContent className="p-7 3xl:p-10 flex items-center justify-between">
                            <div className="space-y-3 flex-1">
                                <Skeleton className="h-3 w-20 rounded-full" />
                                <Skeleton className="h-10 w-16 rounded-lg" />
                            </div>
                            <Skeleton className="h-12 w-12 rounded-2xl flex-none" />
                        </GlassCardContent>
                    </GlassCard>
                ))}

                {/* Bottom 2 Large Stats Cards */}
                {[5, 6].map((i) => (
                    <div key={i} className="lg:col-span-2 relative flex items-center justify-between py-3.5 px-8 rounded-full border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.02)] backdrop-blur-3xl bg-white/40">
                        <Skeleton className="h-10 w-24 rounded-lg" />
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-8 w-8 rounded-full flex-none" />
                            <Skeleton className="h-4 w-32 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid gap-4 3xl:gap-8 md:grid-cols-7">
                <GlassCard className="md:col-span-4 border-white/60 bg-white/40 shadow-sm">
                    <GlassCardHeader className="flex justify-between items-center pb-2">
                        <Skeleton className="h-6 w-48 rounded-md" />
                        <Skeleton className="h-8 w-32 rounded-lg" />
                    </GlassCardHeader>
                    <GlassCardContent>
                        <Skeleton className="h-[280px] 2xl:h-[360px] 3xl:h-[500px] w-full rounded-2xl" />
                    </GlassCardContent>
                </GlassCard>

                <GlassCard className="md:col-span-3 border-white/60 bg-white/40 shadow-sm">
                    <GlassCardHeader className="pb-2">
                        <Skeleton className="h-6 w-48 rounded-md" />
                    </GlassCardHeader>
                    <GlassCardContent className="flex flex-col items-center justify-center">
                        <Skeleton className="h-[200px] w-[200px] 2xl:h-[240px] 2xl:w-[240px] 3xl:h-[320px] 3xl:w-[320px] rounded-full" />
                        <div className="flex flex-wrap justify-center gap-3 mt-8 w-full">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-8 w-24 rounded-full" />
                            ))}
                        </div>
                    </GlassCardContent>
                </GlassCard>
            </div>
        </div>
    )
}

// Table Skeleton
export const TableSkeleton = () => {
    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Table Skeleton */}
            <GlassCard className="flex-1 flex flex-col min-h-0 overflow-hidden shadow-sm border-white/60 bg-white/40">
                {/* Table Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-6">
                    <div className="flex gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-4 flex-1 mix-blend-multiply" />
                        ))}
                    </div>
                </div>

                {/* Table Rows */}
                <div className="p-6 space-y-6 flex-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="flex gap-4 items-center">
                            {[1, 2, 3, 4, 5, 6].map((j) => (
                                <Skeleton key={j} className="h-6 flex-1" />
                            ))}
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    )
}

// Reports Skeleton
export const ReportsSkeleton = () => {
    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <GlassCard key={i} className="border-white/60 bg-white/40 shadow-sm">
                        <GlassCardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            </div>
                        </GlassCardContent>
                    </GlassCard>
                ))}
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                    <GlassCard key={i} className="border-white/60 bg-white/40 shadow-sm">
                        <GlassCardContent className="p-6 space-y-4">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-[300px] w-full" />
                        </GlassCardContent>
                    </GlassCard>
                ))}
            </div>
        </div>
    )
}

// Admin Section Skeleton
export const AdminSectionSkeleton = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Search Bar */}
            <Skeleton className="h-10 w-full md:w-96" />

            {/* Admin Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <GlassCard key={i} className="border-white/60 bg-white/40 shadow-sm">
                        <GlassCardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-4 w-24" />
                                    <div className="flex gap-2 mt-4">
                                        <Skeleton className="h-8 w-20" />
                                        <Skeleton className="h-8 w-20" />
                                        <Skeleton className="h-8 w-20" />
                                    </div>
                                </div>
                            </div>
                        </GlassCardContent>
                    </GlassCard>
                ))}
            </div>
        </div>
    )
}

// Grievance Details Skeleton
export const GrievanceDetailsSkeleton = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-9 w-64" />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <GlassCard className="border-white/60 bg-white/40 shadow-sm">
                        <GlassCardContent className="p-6 space-y-4">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-24 w-full" />
                        </GlassCardContent>
                    </GlassCard>

                    <GlassCard className="border-white/60 bg-white/40 shadow-sm">
                        <GlassCardContent className="p-6 space-y-4">
                            <Skeleton className="h-6 w-40" />
                            <div className="space-y-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-16 w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCardContent>
                    </GlassCard>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <GlassCard className="border-white/60 bg-white/40 shadow-sm">
                        <GlassCardContent className="p-6 space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex justify-between">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                ))}
                            </div>
                        </GlassCardContent>
                    </GlassCard>
                </div>
            </div>
        </div>
    )
}
