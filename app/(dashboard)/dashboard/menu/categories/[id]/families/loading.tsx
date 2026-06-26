import { Skeleton } from '@/components/ui/skeleton'

export default function CategoryFamiliesLoading() {
    return (
        <>
            {/* Header breadcrumb (3 segments) */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-28" />
                </div>
            </header>

            <div className="layout-page">
                {/* Bouton retour */}
                <Skeleton className="h-8 w-44 self-start" />

                {/* Titre + action */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1.5">
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="h-4 w-96 max-w-full" />
                    </div>
                    <Skeleton className="h-10 w-44 rounded-md" />
                </div>

                {/* Liste des familles */}
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                            <Skeleton className="h-8 w-8 rounded shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full shrink-0" />
                            <div className="flex items-center gap-2 shrink-0">
                                <Skeleton className="h-8 w-8 rounded" />
                                <Skeleton className="h-8 w-8 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
