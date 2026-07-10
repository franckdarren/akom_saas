import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader } from '@/components/ui/app-card'

export default function SingpayConfigLoading() {
    return (
        <>
            {/* Header avec bouton retour */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <Skeleton className="h-8 w-24 rounded-md" />
            </header>

            <div className="layout-page">
                {/* Titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-72 max-w-full" />
                    <Skeleton className="h-4 w-96 max-w-full" />
                </div>

                <div className="layout-sections">
                    {/* Activation */}
                    <AppCard>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-56" />
                                <div className="layout-inline">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-6 w-11 rounded-full" />
                                </div>
                            </div>
                        </CardHeader>
                    </AppCard>

                    {/* Configuration du portefeuille */}
                    <AppCard>
                        <CardHeader>
                            <Skeleton className="h-5 w-56" />
                        </CardHeader>
                        <CardContent className="layout-form">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-full rounded-md" />
                                </div>
                            ))}
                            <Skeleton className="h-10 w-56 rounded-md" />
                        </CardContent>
                    </AppCard>

                    {/* URL de callback */}
                    <AppCard variant="flat">
                        <CardHeader>
                            <Skeleton className="h-5 w-40" />
                        </CardHeader>
                        <CardContent className="layout-card-body">
                            <Skeleton className="h-4 w-full max-w-md" />
                            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                                <Skeleton className="h-4 flex-1" />
                                <Skeleton className="h-8 w-8 rounded-md shrink-0" />
                            </div>
                        </CardContent>
                    </AppCard>
                </div>
            </div>
        </>
    )
}
