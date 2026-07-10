import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader } from '@/components/ui/app-card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

export default function SuperadminLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre + sous-titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-80" />
                </div>

                {/* KPI global : 4 cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <AppCard key={i} variant="stat">
                            <CardContent className="layout-card-body">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-4 w-4 rounded" />
                                </div>
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </AppCard>
                    ))}
                </div>

                {/* Abonnements : 4 cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <AppCard key={i} variant="stat">
                            <CardContent className="layout-card-body">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-4 w-4 rounded" />
                                </div>
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </AppCard>
                    ))}
                </div>

                {/* Conformité : 6 cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <AppCard key={i} variant="stat">
                            <CardContent className="layout-card-body">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-4 w-4 rounded" />
                                </div>
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </AppCard>
                    ))}
                </div>

                {/* Activité des 7 derniers jours */}
                <AppCard>
                    <CardHeader>
                        <Skeleton className="h-5 w-56" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between py-2 border-b last:border-0"
                                >
                                    <Skeleton className="h-4 w-24" />
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </AppCard>

                {/* Table établissements */}
                <AppCard>
                    <CardHeader>
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Restaurant</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Commandes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Skeleton className="h-4 w-32" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-24" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Skeleton className="h-4 w-10 ml-auto" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
