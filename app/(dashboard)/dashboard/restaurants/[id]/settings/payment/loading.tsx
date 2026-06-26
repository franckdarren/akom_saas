import { Skeleton } from '@/components/ui/skeleton'

export default function PaymentSettingsLoading() {
    // Cette page ne rend pas d'AppInsetHeader — uniquement le contenu layout-page
    return (
        <div className="layout-page">
            {/* Titre */}
            <div className="space-y-1.5">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-4 w-80 max-w-full" />
            </div>

            <div className="layout-sections">
                {/* Card Mobile Money */}
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5 rounded" />
                                <Skeleton className="h-5 w-36" />
                            </div>
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-full max-w-md" />
                        <Skeleton className="h-10 w-40 rounded-md" />
                    </div>
                ))}
            </div>
        </div>
    )
}
