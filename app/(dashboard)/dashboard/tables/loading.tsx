import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent } from '@/components/ui/app-card'

export default function TablesLoading() {
    return (
        <>
            {/* Header avec breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre + badge quota + sous-titre + bouton ajout */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-28" />
                            <Skeleton className="h-6 w-12 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <Skeleton className="h-9 w-36 rounded-lg shrink-0" />
                </div>

                {/* Utilisation des tables (quota) */}
                <AppCard>
                    <CardContent className="layout-card-body">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1.5">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-56 max-w-full" />
                            </div>
                            <Skeleton className="h-5 w-12 rounded-full shrink-0" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                    </CardContent>
                </AppCard>

                {/* Grid de cards tables */}
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <AppCard key={i}>
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-6 w-24" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                    <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 flex-1 rounded" />
                                    <Skeleton className="h-8 w-8 rounded shrink-0" />
                                    <Skeleton className="h-8 w-8 rounded shrink-0" />
                                </div>
                            </CardContent>
                        </AppCard>
                    ))}
                </div>
            </div>
        </>
    )
}
