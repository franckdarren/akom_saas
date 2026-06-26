import { Skeleton } from '@/components/ui/skeleton'

export default function RestaurantSettingsLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-56" />
                    <Skeleton className="h-4 w-80 max-w-full" />
                </div>

                {/* Sections de formulaire */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Skeleton className="h-5 w-44" />
                            <Skeleton className="h-3 w-64" />
                        </div>
                        {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-full rounded-md" />
                            </div>
                        ))}
                        <Skeleton className="h-10 w-32 rounded-md" />
                    </div>
                ))}
            </div>
        </>
    )
}
