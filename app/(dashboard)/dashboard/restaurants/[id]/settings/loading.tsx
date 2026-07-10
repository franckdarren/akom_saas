import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent } from '@/components/ui/app-card'

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

                {/* Image de couverture */}
                <AppCard>
                    <CardContent className="layout-card-body">
                        <Skeleton className="h-5 w-44" />
                        <Skeleton className="h-40 w-full rounded-md" />
                    </CardContent>
                </AppCard>

                {/* Informations générales */}
                <AppCard>
                    <CardContent className="layout-card-body">
                        <Skeleton className="h-5 w-48" />
                        {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-full rounded-md" />
                            </div>
                        ))}
                    </CardContent>
                </AppCard>

                {/* Lien catalogue public */}
                <AppCard>
                    <CardContent className="layout-card-body">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-52" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-10 w-full rounded-md" />
                        <div className="flex gap-2 flex-wrap">
                            <Skeleton className="h-8 w-24 rounded-md" />
                            <Skeleton className="h-8 w-24 rounded-md" />
                            <Skeleton className="h-8 w-24 rounded-md" />
                        </div>
                    </CardContent>
                </AppCard>

                {/* Logo */}
                <AppCard>
                    <CardContent className="layout-card-body">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-32 w-32 rounded-md" />
                    </CardContent>
                </AppCard>

                {/* Statut */}
                <AppCard>
                    <CardContent className="layout-card-body">
                        <Skeleton className="h-5 w-56" />
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-4 w-4 rounded" />
                            <Skeleton className="h-4 w-64 max-w-full" />
                        </div>
                    </CardContent>
                </AppCard>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <Skeleton className="h-10 w-24 rounded-md" />
                    <Skeleton className="h-10 w-48 rounded-md" />
                </div>
            </div>
        </>
    )
}
