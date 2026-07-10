import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader } from '@/components/ui/app-card'

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

                {/* Grille des familles */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <AppCard key={i}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-5 w-14 rounded-full" />
                                        </div>
                                        <Skeleton className="h-3.5 w-full max-w-[180px]" />
                                    </div>
                                    <Skeleton className="h-8 w-8 rounded shrink-0" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-20" />
                                    <div className="flex gap-1">
                                        <Skeleton className="h-8 w-8 rounded" />
                                        <Skeleton className="h-8 w-8 rounded" />
                                    </div>
                                </div>
                            </CardContent>
                        </AppCard>
                    ))}
                </div>

                {/* Encart "À savoir" */}
                <AppCard variant="flat">
                    <CardContent className="layout-card-body">
                        <Skeleton className="h-4 w-28" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-full max-w-md" />
                            <Skeleton className="h-3.5 w-full max-w-sm" />
                            <Skeleton className="h-3.5 w-full max-w-lg" />
                        </div>
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
