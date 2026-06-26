import { Skeleton } from '@/components/ui/skeleton'

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

                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4 rounded" />
                            </div>
                            <Skeleton className="h-7 w-24" />
                        </div>
                    ))}
                </div>

                {/* Card infos */}
                <div className="rounded-xl border bg-card p-6 space-y-4">
                    <Skeleton className="h-5 w-40" />
                    <div className="grid gap-4 md:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-1.5">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table utilisateurs */}
                <div className="rounded-xl border bg-card p-6 space-y-4">
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
                </div>
            </div>
        </>
    )
}
