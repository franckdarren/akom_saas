import { Skeleton } from '@/components/ui/skeleton'

export default function ProductsLoading() {
    return (
        <>
            {/* Header avec breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-28" />
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Titre + badge quota + bouton ajout */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-32" />
                            <Skeleton className="h-6 w-12 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-9 w-40 rounded-lg shrink-0" />
                </div>

                {/* Grid de cards produits avec image */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card overflow-hidden">
                            {/* Image placeholder */}
                            <Skeleton className="h-40 w-full rounded-none" />
                            <div className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-5 w-20" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 flex-1 rounded" />
                                    <Skeleton className="h-8 w-8 rounded shrink-0" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
