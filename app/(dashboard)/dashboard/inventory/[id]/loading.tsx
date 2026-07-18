import {Skeleton} from '@/components/ui/skeleton'
import {AppCard, CardContent} from '@/components/ui/app-card'

export default function InventorySessionLoading() {
    return (
        <>
            {/* Header avec breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm"/>
                <div className="h-4 w-px bg-border mx-1"/>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20"/>
                    <Skeleton className="h-3 w-3 rounded-sm"/>
                    <Skeleton className="h-4 w-32"/>
                </div>
            </header>

            <div className="layout-page">
                {/* Titre + badge de statut */}
                <div className="space-y-1.5">
                    <div className="layout-inline">
                        <Skeleton className="h-9 w-64"/>
                        <Skeleton className="h-5 w-20 rounded-full"/>
                    </div>
                    <Skeleton className="h-4 w-40"/>
                </div>

                <AppCard>
                    <CardContent className="layout-card-body">
                        {/* Entêtes du tableau de comptage */}
                        <div className="flex items-center gap-4 border-b pb-3">
                            <Skeleton className="h-3 w-20"/>
                            <Skeleton className="ml-auto h-3 w-24"/>
                            <Skeleton className="h-3 w-24"/>
                            <Skeleton className="h-3 w-14"/>
                            <Skeleton className="h-3 w-24"/>
                        </div>

                        {/* Lignes de comptage — l'input de saisie est plus haut que le texte */}
                        {Array.from({length: 8}).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 py-1.5">
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-40"/>
                                    <Skeleton className="h-3 w-16"/>
                                </div>
                                <Skeleton className="ml-auto h-4 w-12"/>
                                <Skeleton className="h-9 w-28 rounded-md"/>
                                <Skeleton className="h-4 w-10"/>
                                <Skeleton className="h-4 w-20"/>
                            </div>
                        ))}

                        {/* Bloc de démarque */}
                        <Skeleton className="h-20 w-full rounded-lg"/>

                        {/* Barre d'actions */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <Skeleton className="h-4 w-40"/>
                            <div className="flex gap-2">
                                <Skeleton className="h-9 w-40 rounded-md"/>
                                <Skeleton className="h-9 w-32 rounded-md"/>
                                <Skeleton className="h-9 w-40 rounded-md"/>
                            </div>
                        </div>
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
