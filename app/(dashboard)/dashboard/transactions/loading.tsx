import {Skeleton} from '@/components/ui/skeleton'

export default function TransactionsLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm"/>
                <div className="h-4 w-px bg-border mx-1"/>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24"/>
                    <Skeleton className="h-3 w-3 rounded-sm"/>
                    <Skeleton className="h-4 w-28"/>
                </div>
            </header>

            <div className="layout-page">
                {/* Titre + sous-titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-36"/>
                    <Skeleton className="h-4 w-64"/>
                </div>

                {/* Cards KPI */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-20"/>
                                <Skeleton className="h-4 w-4 rounded"/>
                            </div>
                            <Skeleton className="h-7 w-32"/>
                            <Skeleton className="h-3 w-24"/>
                        </div>
                    ))}
                </div>

                {/* Barre de filtres */}
                <div className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {Array.from({length: 5}).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-20 rounded-full"/>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Array.from({length: 4}).map((_, i) => (
                            <Skeleton key={i} className="h-9 w-32 rounded-md"/>
                        ))}
                        <Skeleton className="h-9 w-48 rounded-md"/>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border bg-card overflow-hidden">
                    {/* Header table */}
                    <div className="border-b bg-muted/40 px-4 py-3 flex items-center justify-between">
                        <Skeleton className="h-5 w-28"/>
                        <Skeleton className="h-4 w-20"/>
                    </div>
                    {/* Lignes */}
                    <div className="divide-y">
                        {Array.from({length: 8}).map((_, i) => (
                            <div key={i} className="px-4 py-3 flex items-center gap-4">
                                <Skeleton className="h-4 w-28 shrink-0"/>
                                <Skeleton className="h-4 flex-1"/>
                                <Skeleton className="h-5 w-20 rounded-full shrink-0"/>
                                <Skeleton className="h-4 w-24 shrink-0"/>
                                <Skeleton className="h-4 w-24 shrink-0 ml-auto"/>
                                <Skeleton className="h-5 w-20 rounded-full shrink-0"/>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
