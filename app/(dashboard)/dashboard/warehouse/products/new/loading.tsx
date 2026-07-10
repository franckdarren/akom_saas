import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader } from '@/components/ui/app-card'

export default function NewWarehouseProductLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </header>

            <div className="layout-page">
                {/* Bouton retour */}
                <Skeleton className="h-8 w-40 self-start" />

                {/* Titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-4 w-80 max-w-full" />
                </div>

                {/* Formulaire */}
                <div className="max-w-2xl space-y-6">
                    {/* Section 1 : Informations de base */}
                    <AppCard variant="flat">
                        <CardHeader>
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-64 max-w-full" />
                        </CardHeader>
                        <CardContent className="layout-form">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-full rounded-md" />
                            </div>
                            <div className="grid gap-2 sm:gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full rounded-md" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-20 w-full rounded-md" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-32 w-32 rounded-lg" />
                            </div>
                        </CardContent>
                    </AppCard>

                    {/* Section 2 : Unité de stockage */}
                    <AppCard variant="flat">
                        <CardHeader>
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="h-4 w-72 max-w-full" />
                        </CardHeader>
                        <CardContent className="layout-form">
                            <div className="grid gap-2 sm:gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-10 w-full rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-36" />
                                    <Skeleton className="h-10 w-full rounded-md" />
                                </div>
                            </div>
                            <Skeleton className="h-16 w-full rounded-lg" />
                        </CardContent>
                    </AppCard>

                    {/* Section 3 : Lien avec le menu (optionnel) */}
                    <AppCard variant="flat">
                        <CardHeader>
                            <Skeleton className="h-5 w-56" />
                            <Skeleton className="h-4 w-full max-w-md" />
                        </CardHeader>
                        <CardContent className="layout-form">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-full rounded-md" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-10 w-full rounded-md" />
                            </div>
                        </CardContent>
                    </AppCard>

                    {/* Section 4 : Stock initial (création uniquement) */}
                    <AppCard variant="flat">
                        <CardHeader>
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-80 max-w-full" />
                        </CardHeader>
                        <CardContent className="layout-form">
                            <div className="grid gap-2 sm:gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-10 w-full rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-full rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full rounded-md" />
                                </div>
                            </div>
                        </CardContent>
                    </AppCard>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Skeleton className="h-10 w-24 rounded-md" />
                        <Skeleton className="h-10 w-52 rounded-md" />
                    </div>
                </div>
            </div>
        </>
    )
}
