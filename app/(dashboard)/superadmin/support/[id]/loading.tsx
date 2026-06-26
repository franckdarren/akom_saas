import { Skeleton } from '@/components/ui/skeleton'

export default function SuperadminTicketDetailLoading() {
    return (
        <>
            {/* Header : bouton retour + breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <Skeleton className="h-8 w-20 rounded-md" />
                <div className="hidden md:flex items-center gap-2 ml-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-40" />
                </div>
            </header>

            {/* Vue chat */}
            <div className="flex-1 overflow-auto p-6 mb-5 space-y-6">
                {/* Entête ticket */}
                <div className="rounded-xl border bg-card p-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-64 max-w-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                </div>

                {/* Messages */}
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className={i % 2 === 0 ? 'flex justify-start' : 'flex justify-end'}
                        >
                            <div className="space-y-1.5 max-w-[70%]">
                                <Skeleton className="h-16 w-72 max-w-full rounded-lg" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Zone de saisie */}
                <div className="flex items-center gap-3">
                    <Skeleton className="h-11 flex-1 rounded-lg" />
                    <Skeleton className="h-11 w-11 rounded-lg" />
                </div>
            </div>
        </>
    )
}
