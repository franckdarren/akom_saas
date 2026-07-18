import {Skeleton} from '@/components/ui/skeleton'
import {AppCard, CardContent} from '@/components/ui/app-card'

export default function InventoryReportLoading() {
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
                    <Skeleton className="h-3 w-3 rounded-sm"/>
                    <Skeleton className="h-4 w-16"/>
                </div>
            </header>

            <div className="layout-page">
                {/* Titre + boutons d'export */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                        <Skeleton className="h-9 w-56"/>
                        <Skeleton className="h-4 w-72"/>
                    </div>
                    <div className="layout-inline shrink-0">
                        <Skeleton className="h-8 w-32 rounded-md"/>
                        <Skeleton className="h-8 w-32 rounded-md"/>
                    </div>
                </div>

                {/* KPI : comptés, écarts +, écarts −, valorisation */}
                <div className="layout-kpi-grid">
                    {Array.from({length: 4}).map((_, i) => (
                        <AppCard key={i} variant="stat">
                            <CardContent className="layout-card-body">
                                <Skeleton className="h-3 w-24"/>
                                <Skeleton className="h-8 w-20"/>
                            </CardContent>
                        </AppCard>
                    ))}
                </div>

                {/* Tableau des écarts */}
                <AppCard>
                    <CardContent className="layout-card-body">
                        <div className="flex items-center gap-4 border-b pb-3">
                            <Skeleton className="h-3 w-20"/>
                            <Skeleton className="ml-auto h-3 w-24"/>
                            <Skeleton className="h-3 w-24"/>
                            <Skeleton className="h-3 w-14"/>
                            <Skeleton className="h-3 w-24"/>
                        </div>

                        {Array.from({length: 6}).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 py-2">
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-40"/>
                                    <Skeleton className="h-3 w-16"/>
                                </div>
                                <Skeleton className="ml-auto h-4 w-12"/>
                                <Skeleton className="h-4 w-12"/>
                                <Skeleton className="h-4 w-10"/>
                                <Skeleton className="h-4 w-24"/>
                            </div>
                        ))}
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
