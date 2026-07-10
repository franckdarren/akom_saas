import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent } from '@/components/ui/app-card'

export default function StatsLoading() {
    return (
        <>
            {/* Header avec breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </header>

            <div className="space-y-6 p-6">
                {/* Titre + filtre période */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-9 w-52 rounded-lg" />
                </div>

                {/* Barre d'onglets */}
                <div className="flex flex-wrap gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-28 rounded-md" />
                    ))}
                </div>

                {/* 4 KPI cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <AppCard key={i}>
                            <CardContent className="layout-card-body">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-4 w-4 rounded" />
                                </div>
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-3 w-20" />
                            </CardContent>
                        </AppCard>
                    ))}
                </div>

                {/* Graphiques : Revenue + Top produits, Catégories + alerte stock */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        </>
    )
}
