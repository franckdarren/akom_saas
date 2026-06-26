import { Skeleton } from '@/components/ui/skeleton'

export default function POSLoading() {
    return (
        <div className="flex h-svh flex-col lg:flex-row">
            {/* Colonne produits */}
            <div className="flex flex-1 flex-col gap-4 p-4 overflow-hidden">
                {/* Barre de recherche */}
                <Skeleton className="h-10 w-full rounded-lg" />

                {/* Onglets catégories */}
                <div className="flex gap-2 overflow-hidden">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
                    ))}
                </div>

                {/* Grille produits */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card overflow-hidden">
                            <Skeleton className="aspect-square w-full rounded-none" />
                            <div className="p-3 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Panneau panier */}
            <div className="flex w-full flex-col gap-4 border-t bg-card p-4 lg:w-96 lg:border-l lg:border-t-0">
                <Skeleton className="h-6 w-32" />
                <div className="flex-1 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                            <Skeleton className="h-8 w-20 rounded-md shrink-0" />
                        </div>
                    ))}
                </div>
                <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex justify-between">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-28" />
                    </div>
                    <Skeleton className="h-12 w-full rounded-lg" />
                </div>
            </div>
        </div>
    )
}
