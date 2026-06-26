import { Skeleton } from '@/components/ui/skeleton'

export default function EditProductLoading() {
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
                    <Skeleton className="h-4 w-48" />
                </div>

                {/* Formulaire produit */}
                <div className="rounded-xl border bg-card p-6 space-y-6">
                    {/* Image */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-40 w-40 rounded-lg" />
                    </div>
                    {/* Champs */}
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                    ))}
                    <div className="flex gap-3 pt-2">
                        <Skeleton className="h-10 w-32 rounded-md" />
                        <Skeleton className="h-10 w-24 rounded-md" />
                    </div>
                </div>
            </div>
        </>
    )
}
