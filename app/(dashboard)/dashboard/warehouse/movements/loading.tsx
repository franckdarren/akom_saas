import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent } from '@/components/ui/app-card'

export default function WarehouseMovementsLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-36" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre + action */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1.5">
                        <Skeleton className="h-9 w-56" />
                        <Skeleton className="h-4 w-80 max-w-full" />
                    </div>
                    <Skeleton className="h-10 w-40 rounded-md" />
                </div>

                {/* Stats cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <AppCard key={i}>
                            <CardContent className="layout-card-body">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-8 w-1/2" />
                            </CardContent>
                        </AppCard>
                    ))}
                </div>

                {/* Filtres + timeline */}
                <AppCard>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-9 w-32 rounded-md" />
                            ))}
                        </div>
                        <div className="space-y-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
