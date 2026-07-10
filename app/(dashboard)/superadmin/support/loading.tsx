import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent } from '@/components/ui/app-card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

export default function SuperadminSupportLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-28" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-64 max-w-full" />
                </div>

                {/* Stats cards */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <AppCard key={i}>
                            <CardContent className="layout-card-body">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-7 w-16" />
                            </CardContent>
                        </AppCard>
                    ))}
                </div>

                {/* Table tickets */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sujet</TableHead>
                            <TableHead className="hidden sm:table-cell">Restaurant</TableHead>
                            <TableHead className="hidden sm:table-cell">Priorité</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="hidden lg:table-cell">Messages</TableHead>
                            <TableHead className="hidden lg:table-cell">Créé le</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell>
                                    <Skeleton className="h-4 w-40" />
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                    <Skeleton className="h-4 w-32" />
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                    <Skeleton className="h-4 w-10" />
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                    <Skeleton className="h-4 w-24" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Skeleton className="h-8 w-20 rounded-md ml-auto" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}
