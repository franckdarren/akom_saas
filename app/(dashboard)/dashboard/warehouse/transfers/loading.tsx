import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent } from '@/components/ui/app-card'

export default function WarehouseTransfersLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-40" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre + action */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1.5">
                        <Skeleton className="h-9 w-56" />
                        <Skeleton className="h-4 w-80 max-w-full" />
                    </div>
                    <Skeleton className="h-9 w-40 rounded-md" />
                </div>

                {/* Stats cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <AppCard key={i}>
                            <CardContent className="layout-card-body">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </AppCard>
                    ))}
                </div>

                {/* Table transferts */}
                <AppCard>
                    <CardContent className="p-0">
                        <div className="border-b bg-muted/40 px-4 py-3 flex items-center gap-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-20 ml-auto" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="divide-y">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="px-4 py-3 flex items-center gap-4">
                                    <div className="flex items-center gap-3 flex-1">
                                        <Skeleton className="h-8 w-8 rounded shrink-0" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <Skeleton className="h-4 w-4 rounded shrink-0" />
                                    <div className="flex items-center gap-3 flex-1">
                                        <Skeleton className="h-8 w-8 rounded shrink-0" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <Skeleton className="h-5 w-24 rounded-full shrink-0 ml-auto" />
                                    <Skeleton className="h-4 w-24 shrink-0" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
