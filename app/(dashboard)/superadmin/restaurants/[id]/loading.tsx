import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader } from '@/components/ui/app-card'

export default function SuperadminRestaurantDetailLoading() {
    return (
        <>
            {/* Header avec bouton retour */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <Skeleton className="h-8 w-24 rounded-md" />
            </header>

            <div className="layout-page">
                {/* En-tête établissement */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                        <Skeleton className="h-9 w-56" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-9 w-32 rounded-md" />
                </div>

                {/* Card infos */}
                <AppCard>
                    <CardHeader>
                        <Skeleton className="h-5 w-32" />
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-1.5">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                        ))}
                    </CardContent>
                </AppCard>

                {/* Statistiques */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <AppCard key={i}>
                            <CardContent className="layout-card-body">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-4 rounded" />
                                </div>
                                <Skeleton className="h-7 w-24" />
                            </CardContent>
                        </AppCard>
                    ))}
                </div>

                {/* Table utilisateurs */}
                <AppCard>
                    <CardContent className="layout-card-body">
                        <Skeleton className="h-5 w-36" />
                        <div className="divide-y">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 py-3">
                                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-5 w-16 rounded-full ml-auto" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </AppCard>

                {/* Paiement Mobile Money */}
                <AppCard>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="layout-inline">
                                <Skeleton className="h-5 w-5 rounded" />
                                <Skeleton className="h-5 w-48" />
                            </div>
                            <Skeleton className="h-5 w-24 rounded-full" />
                        </div>
                    </CardHeader>
                    <CardContent className="layout-card-body">
                        <Skeleton className="h-4 w-64 max-w-full" />
                        <Skeleton className="h-4 w-40" />
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
