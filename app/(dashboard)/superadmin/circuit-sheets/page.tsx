// app/superadmin/circuit-sheets/page.tsx
import { getSuperadminUser } from '@/lib/auth/superadmin'
import { redirect } from 'next/navigation'
import { getPendingCircuitSheets } from '@/lib/actions/superadmin/restaurant-verification'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon, AlertTriangle } from 'lucide-react'
import { CircuitSheetCard } from '@/components/superadmin/circuit-sheet-card'
import { getDaysRemaining, isDeadlineOverdue } from '@/types/restaurant-verification'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export default async function CircuitSheetsPage() {
    const user = await getSuperadminUser()

    if (!user) {
        redirect('/dashboard')
    }

    // Récupérer toutes les fiches circuit en attente
    const result = await getPendingCircuitSheets()

    if (!result.success || !result.data) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">
                    Erreur lors du chargement des fiches circuit
                </p>
            </div>
        )
    }

    const circuitSheets = result.data

    // Séparer par urgence pour priorisation
    const overdue = circuitSheets.filter(cs =>
        isDeadlineOverdue(new Date(cs.deadlineAt))
    )
    const urgent = circuitSheets.filter(cs => {
        const days = getDaysRemaining(new Date(cs.deadlineAt))
        return days > 0 && days <= 7
    })
    const normal = circuitSheets.filter(cs => {
        const days = getDaysRemaining(new Date(cs.deadlineAt))
        return days > 7
    })

    return (
        <>
            {/* En-tête */}
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
                                <BreadcrumbPage>Fiches circuit à valider</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold">Fiches circuit à valider</h1>
                    <p className="text-muted-foreground mt-2">
                        Vérifiez et validez les fiches circuit soumises par les restaurants Business
                    </p>
                </div>

                {/* Alert d'information */}
                <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                        Les fiches circuit sont obligatoires pour les restaurants sous offre Business ou Premium.
                        Elles doivent être soumises dans les 3 mois suivant l'activation de l'abonnement.
                        Vérifiez que le document contient bien l'organigramme, le circuit des commandes,
                        la gestion des stocks et les horaires du personnel.
                    </AlertDescription>
                </Alert>

                {/* Statistiques rapides */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total en attente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{circuitSheets.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Échéance dépassée
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {overdue.length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Urgentes (&lt; 7 jours)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {urgent.length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Dans les délais
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {normal.length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Section : Échéance dépassée (priorité maximale) */}
                {overdue.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <h2 className="text-xl font-semibold">Échéance dépassée</h2>
                            <Badge variant="destructive">{overdue.length}</Badge>
                        </div>

                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Ces restaurants ont dépassé la deadline de 3 mois. Ils ont normalement été
                                suspendus automatiquement. Validez leurs fiches rapidement pour les réactiver.
                            </AlertDescription>
                        </Alert>

                        <div className="grid gap-4 md:grid-cols-2">
                            {overdue.map((circuitSheet) => (
                                <CircuitSheetCard
                                    key={circuitSheet.id}
                                    circuitSheet={circuitSheet}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Section : Urgentes (moins de 7 jours) */}
                {urgent.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold">Urgentes</h2>
                            <Badge variant="secondary">{urgent.length}</Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Ces restaurants ont moins de 7 jours pour soumettre leur fiche circuit.
                            Validez-les rapidement une fois soumises pour éviter la suspension automatique.
                        </p>

                        <div className="grid gap-4 md:grid-cols-2">
                            {urgent.map((circuitSheet) => (
                                <CircuitSheetCard
                                    key={circuitSheet.id}
                                    circuitSheet={circuitSheet}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Section : Dans les délais */}
                {normal.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold">Dans les délais</h2>
                            <Badge variant="secondary">{normal.length}</Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {normal.map((circuitSheet) => (
                                <CircuitSheetCard
                                    key={circuitSheet.id}
                                    circuitSheet={circuitSheet}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Message si aucune fiche */}
                {circuitSheets.length === 0 && (
                    <Card>
                        <CardContent className="text-center py-12">
                            <p className="text-muted-foreground">
                                Aucune fiche circuit en attente de validation pour le moment.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    )
}