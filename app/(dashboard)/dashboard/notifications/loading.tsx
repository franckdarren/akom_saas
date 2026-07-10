import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader } from '@/components/ui/app-card'

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
                {/* Titre + actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1.5">
                        <Skeleton className="h-9 w-44" />
                        <Skeleton className="h-4 w-64 max-w-full" />
                    </div>
                    <div className="layout-inline">
                        <Skeleton className="h-9 w-44 rounded-md" />
                        <Skeleton className="h-9 w-32 rounded-md" />
                    </div>
                </div>

                {/* Tabs */}
                <div className="layout-inline">
                    <Skeleton className="h-9 w-20 rounded-md" />
                    <Skeleton className="h-9 w-28 rounded-md" />
                </div>

                {/* Liste des notifications */}
                <AppCard>
                    <CardHeader>
                        <Skeleton className="h-5 w-24" />
                    </CardHeader>
                    <CardContent className="p-0 divide-y">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-4 px-6 py-4">
                                <Skeleton className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-4 w-16 rounded-full" />
                                    </div>
                                    <Skeleton className="h-3 w-3/4" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
