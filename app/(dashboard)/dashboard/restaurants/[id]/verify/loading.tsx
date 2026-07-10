import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader } from '@/components/ui/app-card'

export default function RestaurantVerifyLoading() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Header breadcrumb (3 segments) */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-4 w-96 max-w-full" />
                </div>

                {/* Formulaire de vérification : upload de documents */}
                <AppCard className="max-w-2xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1.5">
                                <Skeleton className="h-5 w-56" />
                                <Skeleton className="h-3 w-72 max-w-full" />
                            </div>
                            <Skeleton className="h-6 w-28 rounded-full shrink-0" />
                        </div>
                    </CardHeader>
                    <CardContent className="layout-form">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-40 w-full rounded-lg" />
                            </div>
                        ))}
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <div className="flex justify-end">
                            <Skeleton className="h-10 w-44 rounded-md" />
                        </div>
                    </CardContent>
                </AppCard>
            </div>
        </div>
    )
}
