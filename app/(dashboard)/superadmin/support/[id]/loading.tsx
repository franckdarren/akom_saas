import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader } from '@/components/ui/app-card'

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
            <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Conversation */}
                    <div className="lg:col-span-2">
                        <AppCard>
                            <CardContent className="p-0">
                                {/* Header ticket */}
                                <div className="p-4 border-b bg-muted/40 flex items-start justify-between">
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-6 w-64 max-w-full" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                    <Skeleton className="h-8 w-24 rounded-md" />
                                </div>

                                {/* Messages */}
                                <div className="p-4 space-y-4">
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
                                <div className="p-4 border-t bg-muted/40 flex gap-2">
                                    <Skeleton className="h-16 flex-1 rounded-md" />
                                    <Skeleton className="h-10 w-10 rounded-md" />
                                </div>
                            </CardContent>
                        </AppCard>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <AppCard key={i}>
                                <CardHeader>
                                    <Skeleton className="h-4 w-32" />
                                </CardHeader>
                                <CardContent className="layout-card-body">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </CardContent>
                            </AppCard>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
