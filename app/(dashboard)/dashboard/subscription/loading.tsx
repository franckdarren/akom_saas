import { Skeleton } from '@/components/ui/skeleton'

export default function SubscriptionLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre + sous-titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-44" />
                    <Skeleton className="h-4 w-72 max-w-full" />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Card plan actuel */}
                    <div className="md:col-span-2 rounded-xl border bg-card p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1.5">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-8 w-28" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-7 w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Skeleton className="h-px w-full" />

                        <div className="text-center space-y-2 py-4">
                            <Skeleton className="h-3 w-32 mx-auto" />
                            <Skeleton className="h-12 w-16 mx-auto" />
                        </div>

                        <Skeleton className="h-px w-full" />

                        <div className="space-y-3">
                            <Skeleton className="h-5 w-48" />
                            <div className="grid md:grid-cols-2 gap-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Skeleton className="h-10 w-40" />
                            <Skeleton className="h-10 w-40" />
                        </div>
                    </div>

                    {/* Card historique paiements */}
                    <div className="md:col-span-2 rounded-xl border bg-card p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-3 w-64" />
                        </div>
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-5 w-5 rounded-full" />
                                        <div className="space-y-1.5">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
