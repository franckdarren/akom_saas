import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader } from '@/components/ui/app-card'
import { Separator } from '@/components/ui/separator'

export default function ModulesLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-4 w-96 max-w-full" />
                </div>

                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-6">

                    {/* Grille de modules groupée */}
                    <div className="flex-1 layout-sections">

                        {/* Bouton reset */}
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-80 max-w-full" />
                            <Skeleton className="h-9 w-32 rounded-md" />
                        </div>

                        {Array.from({ length: 5 }).map((_, g) => (
                            <div key={g} className="layout-sections gap-3">
                                <Skeleton className="h-3 w-24" />
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {Array.from({ length: 2 }).map((_, i) => (
                                        <AppCard key={i}>
                                            <CardContent className="layout-card-body">
                                                <div className="flex items-start justify-between">
                                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                                    <Skeleton className="h-6 w-11 rounded-full" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Skeleton className="h-5 w-32" />
                                                    <Skeleton className="h-3 w-full" />
                                                    <Skeleton className="h-3 w-2/3" />
                                                </div>
                                            </CardContent>
                                        </AppCard>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Aperçu live sidebar */}
                    <div className="hidden lg:block lg:w-64 shrink-0">
                        <AppCard>
                            <CardHeader className="pb-3">
                                <Skeleton className="h-5 w-36" />
                                <Skeleton className="h-3 w-28" />
                            </CardHeader>
                            <Separator />
                            <CardContent className="pt-3 space-y-2">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <Skeleton key={i} className="h-5 w-full" />
                                ))}
                            </CardContent>
                        </AppCard>
                    </div>

                </div>
            </div>
        </>
    )
}
