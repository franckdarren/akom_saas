import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent } from '@/components/ui/app-card'

export default function POSLoading() {
    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header avec breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </header>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* Colonne produits */}
                <div className="flex flex-1 flex-col gap-4 p-4 overflow-hidden">
                    {/* Onglets catégories */}
                    <div className="flex gap-2 overflow-hidden">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
                        ))}
                    </div>

                    {/* Grille produits */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <AppCard key={i} className="overflow-hidden">
                                <Skeleton className="aspect-square w-full rounded-none" />
                                <CardContent className="p-3 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardContent>
                            </AppCard>
                        ))}
                    </div>
                </div>

                {/* Panneau panier */}
                <div className="flex w-full flex-col border-t bg-card lg:w-96 lg:border-l lg:border-t-0">
                    <div className="flex-1 space-y-2 px-4 py-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5">
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-6 w-16 shrink-0 rounded-md" />
                                <Skeleton className="h-4 w-14 shrink-0" />
                            </div>
                        ))}
                    </div>
                    <div className="border-t px-4 py-3">
                        <Skeleton className="h-16 w-full rounded-md" />
                    </div>
                    <div className="space-y-3 border-t px-4 py-4 shrink-0">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-6 w-28" />
                        </div>
                        <Skeleton className="h-11 w-full rounded-md" />
                        <Skeleton className="h-8 w-full rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    )
}
