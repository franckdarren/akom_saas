// app/superadmin/verifications/page.tsx
import { getSuperadminUser } from '@/lib/auth/superadmin'
import { redirect } from 'next/navigation'
import { getRestaurantsPendingVerification } from '@/lib/actions/superadmin/restaurant-verification'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'
import { RestaurantVerificationCard } from '@/components/superadmin/restaurant-verification-card'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export default async function VerificationsPage() {
    const user = await getSuperadminUser()

    if (!user) {
        redirect('/dashboard')
    }

    // Récupérer tous les restaurants en attente de vérification
    const result = await getRestaurantsPendingVerification()

    if (!result.success || !result.data) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">
                    Erreur lors du chargement des restaurants
                </p>
            </div>
        )
    }

    const restaurants = result.data

    // Séparer les restaurants par statut pour un affichage organisé
    const documentsSubmitted = restaurants.filter(
        r => r.verificationStatus === 'documents_submitted'
    )
    const pendingDocuments = restaurants.filter(
        r => r.verificationStatus === 'pending_documents'
    )

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
                                <BreadcrumbPage>Vérifications des restaurants</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold">Vérifications des restaurants</h1>
                    <p className="text-muted-foreground mt-2">
                        Validez ou rejetez les documents d'identité soumis par les restaurants
                    </p>
                </div>

                {/* Alert d'information */}
                <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                        Les restaurants ne peuvent pas être activés tant que leurs documents ne sont pas vérifiés.
                        Vérifiez que la photo de profil et la pièce d'identité correspondent bien à la même personne
                        et que les documents sont valides. En cas de doute, rejetez avec une explication claire.
                    </AlertDescription>
                </Alert>

                {/* Statistiques rapides */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total en attente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{restaurants.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Documents soumis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {documentsSubmitted.length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                En attente de documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {pendingDocuments.length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Section : Documents soumis (prioritaire) */}
                {documentsSubmitted.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold">Documents soumis</h2>
                            <Badge variant="default">{documentsSubmitted.length}</Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {documentsSubmitted.map((restaurant) => (
                                <RestaurantVerificationCard
                                    key={restaurant.id}
                                    restaurant={restaurant}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Section : En attente de documents (moins urgent) */}
                {pendingDocuments.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold">En attente de documents</h2>
                            <Badge variant="secondary">{pendingDocuments.length}</Badge>
                        </div>

                        <div className="text-sm text-muted-foreground mb-4">
                            Ces restaurants n'ont pas encore uploadé leurs documents. Ils ne nécessitent
                            aucune action de votre part pour le moment.
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {pendingDocuments.map((restaurant) => (
                                <Card key={restaurant.id}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle>{restaurant.name}</CardTitle>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Créé le {new Date(restaurant.createdAt).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                            <Badge variant="secondary">
                                                En attente de documents
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            Le restaurant n'a pas encore soumis ses documents de vérification.
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Message si aucun restaurant */}
                {restaurants.length === 0 && (
                    <Card>
                        <CardContent className="text-center py-12">
                            <p className="text-muted-foreground">
                                Aucun restaurant en attente de vérification pour le moment.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    )
}