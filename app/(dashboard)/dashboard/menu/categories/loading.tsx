import { Skeleton } from '@/components/ui/skeleton'

export default function CategoriesLoading() {
    return (
        <>
            {/* Header avec breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre + badge quota + bouton ajout */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-36" />
                            <Skeleton className="h-6 w-12 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-9 w-40 rounded-lg shrink-0" />
                </div>

                {/* Grid de cards catégories */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-4 flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-2 min-w-0">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Skeleton className="h-7 w-7 rounded" />
                                <Skeleton className="h-7 w-7 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
