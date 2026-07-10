import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader } from '@/components/ui/app-card'

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

                {/* Quota */}
                <AppCard>
                    <CardContent className="layout-card-body">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1.5">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3.5 w-40" />
                            </div>
                            <Skeleton className="h-5 w-12 rounded-full" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                    </CardContent>
                </AppCard>

                {/* Grid de cards catégories */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <AppCard key={i}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-1.5 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-5 w-28" />
                                            <Skeleton className="h-5 w-14 rounded-full" />
                                        </div>
                                        <Skeleton className="h-3.5 w-full max-w-[180px]" />
                                    </div>
                                    <Skeleton className="h-8 w-8 rounded shrink-0" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex items-center gap-1">
                                        <Skeleton className="h-4 w-4 rounded" />
                                        <Skeleton className="h-3.5 w-16" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Skeleton className="h-4 w-4 rounded" />
                                        <Skeleton className="h-3.5 w-16" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-9 w-full rounded-md" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-9 flex-1 rounded-md" />
                                        <Skeleton className="h-9 flex-1 rounded-md" />
                                    </div>
                                </div>
                            </CardContent>
                        </AppCard>
                    ))}
                </div>
            </div>
        </>
    )
}
