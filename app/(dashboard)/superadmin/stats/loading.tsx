import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent } from '@/components/ui/app-card'

export default function SuperadminStatsLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-44" />
                    <Skeleton className="h-4 w-56" />
                </div>

                {/* Stats temps réel */}
                <div className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <AppCard key={i}>
                            <CardContent className="layout-card-body">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-4 rounded" />
                                </div>
                                <Skeleton className="h-7 w-28" />
                                <Skeleton className="h-3 w-20" />
                            </CardContent>
                        </AppCard>
                    ))}
                </div>

                {/* Graphique */}
                <AppCard>
                    <CardContent className="layout-card-body">
                        <div className="space-y-1.5">
                            <Skeleton className="h-5 w-44" />
                            <Skeleton className="h-3 w-64" />
                        </div>
                        <Skeleton className="h-72 w-full rounded-lg" />
                    </CardContent>
                </AppCard>

                {/* 2 tables top */}
                {Array.from({ length: 2 }).map((_, i) => (
                    <AppCard key={i}>
                        <CardContent className="layout-card-body">
                            <div className="space-y-1.5">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-3 w-56" />
                            </div>
                            <div className="divide-y">
                                {Array.from({ length: 6 }).map((_, j) => (
                                    <div key={j} className="flex items-center gap-4 py-3">
                                        <Skeleton className="h-4 w-6" />
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-4 w-20 ml-auto" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </AppCard>
                ))}
            </div>
        </>
    )
}
