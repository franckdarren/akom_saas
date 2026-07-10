import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent } from '@/components/ui/app-card'

export default function SuperadminUsersLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre + total */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                        <Skeleton className="h-9 w-44" />
                        <Skeleton className="h-4 w-64 max-w-full" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                </div>

                {/* Card avec table */}
                <AppCard>
                    <CardContent className="layout-card-body">
                        <div className="space-y-1.5">
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="h-3 w-56" />
                        </div>
                        {/* Header table */}
                        <div className="flex items-center gap-4 border-b pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-24 ml-auto" />
                        </div>
                        {/* Lignes */}
                        <div className="divide-y">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 py-3">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-4 w-24 ml-auto" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
