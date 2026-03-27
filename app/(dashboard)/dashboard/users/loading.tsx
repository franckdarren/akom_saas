import { Skeleton } from '@/components/ui/skeleton'

export default function UsersLoading() {
    return (
        <>
            {/* Header avec breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-36" />
                </div>
            </header>

            <div className="flex flex-col gap-6 p-6">
                {/* Titre + sous-titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-56" />
                    <Skeleton className="h-4 w-80" />
                </div>

                {/* Onglets */}
                <div className="flex gap-1 border-b">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-28 rounded-b-none rounded-t" />
                    ))}
                </div>

                {/* Table membres */}
                <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="flex items-center gap-4 px-6 py-3 border-b bg-muted/50">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-28 ml-auto" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="divide-y">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4">
                                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-52" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-8 w-8 rounded shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
