import {Skeleton} from '@/components/ui/skeleton'
import {AppCard, CardContent} from '@/components/ui/app-card'

export default function InventoryLoading() {
    return (
        <>
            {/* Header avec breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm"/>
                <div className="h-4 w-px bg-border mx-1"/>
                <Skeleton className="h-4 w-24"/>
            </header>

            <div className="layout-page">
                {/* Titre + action */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                        <Skeleton className="h-9 w-48"/>
                        <Skeleton className="h-4 w-80"/>
                    </div>
                    <Skeleton className="h-9 w-44 rounded-md shrink-0"/>
                </div>

                {/* Filtres de périmètre */}
                <div className="layout-inline">
                    <Skeleton className="h-8 w-16 rounded-md"/>
                    <Skeleton className="h-8 w-20 rounded-md"/>
                    <Skeleton className="h-8 w-24 rounded-md"/>
                </div>

                {/* Tableau des sessions */}
                <AppCard>
                    <CardContent className="layout-card-body">
                        {/* Entêtes */}
                        <div className="flex items-center gap-4 border-b pb-3">
                            <Skeleton className="h-3 w-28"/>
                            <Skeleton className="h-3 w-20"/>
                            <Skeleton className="h-3 w-16"/>
                            <Skeleton className="ml-auto h-3 w-16"/>
                            <Skeleton className="h-3 w-20"/>
                            <Skeleton className="h-3 w-24"/>
                        </div>

                        {/* Lignes */}
                        {Array.from({length: 5}).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 py-2">
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-32"/>
                                    <Skeleton className="h-3 w-24"/>
                                </div>
                                <Skeleton className="h-4 w-16"/>
                                <Skeleton className="h-5 w-20 rounded-full"/>
                                <Skeleton className="ml-auto h-4 w-12"/>
                                <Skeleton className="h-4 w-14"/>
                                <Skeleton className="h-4 w-20"/>
                                <Skeleton className="h-8 w-20 rounded-md shrink-0"/>
                            </div>
                        ))}
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
