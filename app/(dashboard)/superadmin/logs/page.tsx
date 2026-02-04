import { getLogs, getLogsStats } from '@/lib/actions/logs'
import { formatDate } from '@/lib/utils/format'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Suspense } from 'react'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Info, AlertTriangle, XCircle, AlertOctagon } from 'lucide-react'

export default async function LogsPage() {
    const [logs, stats] = await Promise.all([getLogs(), getLogsStats()])

    function getLevelBadge(level: string) {
        const variants: Record<
            string,
            { label: string; variant: any; icon: any }
        > = {
            info: {
                label: 'Info',
                variant: 'outline',
                icon: Info,
            },
            warning: {
                label: 'Warning',
                variant: 'default',
                icon: AlertTriangle,
            },
            error: {
                label: 'Erreur',
                variant: 'destructive',
                icon: XCircle,
            },
            critical: {
                label: 'Critique',
                variant: 'destructive',
                icon: AlertOctagon,
            },
        }
        return variants[level] || variants.info
    }

    return (
        <>
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/superadmin">Administration</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Logs Système</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className='flex flex-col gap-6 p-6'>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Logs Système</h1>
                    <p className="text-muted-foreground mt-2">
                        Historique des événements système
                    </p>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total
                            </CardTitle>
                            <Info className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                {stats.last24hCount} dernières 24h
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Warnings
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.warnings}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Erreurs
                            </CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.errors}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Critiques
                            </CardTitle>
                            <AlertOctagon className="h-4 w-4 text-red-800" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.criticals}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Liste des logs */}
                <Card>
                    <CardHeader>
                        <CardTitle>Derniers événements</CardTitle>
                        <CardDescription>
                            100 derniers logs, triés par date
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Niveau</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>User ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center text-zinc-600 dark:text-zinc-400"
                                        >
                                            Aucun log
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => {
                                        const levelBadge = getLevelBadge(log.level)
                                        const Icon = levelBadge.icon

                                        return (
                                            <TableRow key={log.id}>
                                                <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    {formatDate(log.createdAt)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={levelBadge.variant}
                                                        className="gap-1"
                                                    >
                                                        <Icon className="h-3 w-3" />
                                                        {levelBadge.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {log.action}
                                                </TableCell>
                                                <TableCell>
                                                    {log.message}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                                                    {log.userId
                                                        ? log.userId.slice(0, 8) +
                                                        '...'
                                                        : '-'}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>


        </>
    )
}