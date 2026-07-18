import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader } from '@/components/ui/app-card'

export default function StocksLoading() {
    return (
        <>
            {/* Header avec breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre + sous-titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-56" />
                    <Skeleton className="h-4 w-96" />
                </div>

                {/* Barre de recherche */}
                <Skeleton className="h-10 w-full max-w-sm rounded-lg" />

                {/* KPI de valorisation */}
                <div className="layout-kpi-grid">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <AppCard key={i} variant="stat">
                            <CardContent className="layout-card-body">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-8 w-28" />
                            </CardContent>
                        </AppCard>
                    ))}
                </div>

                {/* Bascule Quantités / Valeur */}
                <Skeleton className="h-9 w-56 rounded-lg" />

                {/* Grille de cards produit */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <AppCard key={i}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <Skeleton className="h-5 w-20 rounded-full shrink-0" />
                                </div>
                            </CardHeader>
                            <CardContent className="layout-card-body">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-7 w-10" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-4 w-10" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 flex-1 rounded" />
                                    <Skeleton className="h-8 w-8 rounded shrink-0" />
                                </div>
                            </CardContent>
                        </AppCard>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                </div>
            </div>
        </>
    )
}
