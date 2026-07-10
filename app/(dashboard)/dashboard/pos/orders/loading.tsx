import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent } from '@/components/ui/app-card'
import { Separator } from '@/components/ui/separator'

export default function POSOrdersLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-36" />
                </div>
            </header>

            <div className="layout-page sm:gap-6 sm:p-6 overflow-auto">
                {/* Titre + sélecteur de date */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1.5">
                        <Skeleton className="h-9 w-52" />
                        <Skeleton className="h-4 w-64 max-w-full" />
                    </div>
                    <Skeleton className="h-9 w-40 rounded-md" />
                </div>

                {/* KPIs du jour */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <AppCard key={i}>
                            <CardContent className="p-2.5 sm:p-4 flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                    <Skeleton className="h-3.5 w-3.5 rounded" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                                <Skeleton className="h-6 w-14" />
                            </CardContent>
                        </AppCard>
                    ))}
                </div>

                {/* Filtres par statut (chips) */}
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-24 rounded-lg" />
                    ))}
                </div>

                {/* Grille de cards commandes */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <AppCard key={i}>
                            {/* En-tête */}
                            <div className="flex items-start justify-between px-4 pt-4 pb-3">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-4 w-14 shrink-0" />
                            </div>

                            <Separator />

                            {/* Articles */}
                            <div className="px-4 py-3 flex flex-col gap-1.5">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={j} className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-36" />
                                        <Skeleton className="h-3 w-10" />
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            {/* Pied : paiement + actions */}
                            <div className="px-4 py-3 flex items-center justify-between gap-2">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-7 w-24 rounded-md" />
                            </div>
                        </AppCard>
                    ))}
                </div>
            </div>
        </>
    )
}
