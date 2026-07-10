import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent } from '@/components/ui/app-card'

export default function WarehouseProductDetailLoading() {
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
                {/* Bouton retour */}
                <Skeleton className="h-8 w-44 self-start" />

                {/* Image + infos */}
                <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <div className="space-y-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-9 w-56" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-9 w-28 rounded-md" />
                        </div>
                        {/* Quick actions */}
                        <div className="flex flex-wrap gap-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-36 rounded-md" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Card stock */}
                <AppCard>
                    <CardContent className="layout-card-body">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-3 w-32" />
                    </CardContent>
                </AppCard>

                {/* Card historique */}
                <AppCard>
                    <CardContent className="layout-card-body">
                        <Skeleton className="h-5 w-48" />
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
