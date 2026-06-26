import { Skeleton } from '@/components/ui/skeleton'

export default function NotificationsLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre + action */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                        <Skeleton className="h-9 w-44" />
                        <Skeleton className="h-4 w-64 max-w-full" />
                    </div>
                    <Skeleton className="h-9 w-36 rounded-md" />
                </div>

                {/* Liste des notifications */}
                <div className="rounded-xl border bg-card divide-y">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-4">
                            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-3 w-3/4" />
                            </div>
                            <Skeleton className="h-3 w-16 shrink-0" />
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
