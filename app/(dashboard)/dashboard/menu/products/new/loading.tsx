import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent } from '@/components/ui/app-card'

export default function NewProductLoading() {
    return (
        <>
            {/* Header breadcrumb (3 segments) */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </header>

            <div className="layout-page max-w-2xl">
                {/* Bouton retour */}
                <Skeleton className="h-8 w-44 self-start" />

                {/* Titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-56" />
                    <Skeleton className="h-4 w-80 max-w-full" />
                </div>

                {/* Formulaire produit */}
                <AppCard>
                    <CardContent className="layout-form">
                        {/* Sélecteur de type */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-3.5 w-72 max-w-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex flex-col items-center gap-3 p-6 rounded-lg border-2"
                                    >
                                        <Skeleton className="h-8 w-8 rounded" />
                                        <div className="flex flex-col items-center gap-1.5">
                                            <Skeleton className="h-4 w-16" />
                                            <Skeleton className="h-3 w-28" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Champs */}
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-full rounded-md" />
                            </div>
                        ))}

                        {/* Image */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-40 w-40 rounded-lg" />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Skeleton className="h-10 w-32 rounded-md" />
                            <Skeleton className="h-10 w-24 rounded-md" />
                        </div>
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
