import { Skeleton } from '@/components/ui/skeleton'

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

            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Titre + sous-titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-56" />
                    <Skeleton className="h-4 w-96" />
                </div>

                {/* Barre de recherche */}
                <Skeleton className="h-10 w-full max-w-sm rounded-lg" />

                {/* Table stocks */}
                <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="flex items-center gap-4 px-6 py-3 border-b bg-muted/50">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-24 ml-auto" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="divide-y">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4">
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full shrink-0" />
                                <div className="flex items-center gap-2 shrink-0">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <Skeleton className="h-6 w-12" />
                                    <Skeleton className="h-8 w-8 rounded" />
                                </div>
                                <Skeleton className="h-4 w-16 shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
