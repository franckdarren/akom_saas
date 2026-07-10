import { Skeleton } from '@/components/ui/skeleton'

export default function SupportLoading() {
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
                    <Skeleton className="h-9 w-36" />
                    <Skeleton className="h-4 w-72 max-w-full" />
                </div>

                {/* Bouton nouveau ticket */}
                <Skeleton className="h-10 w-48 rounded-md" />

                {/* Liste des tickets */}
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                            <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-3 w-2/3" />
                            </div>
                            <Skeleton className="h-5 w-20 rounded-full shrink-0" />
                            <Skeleton className="h-3 w-16 shrink-0" />
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
