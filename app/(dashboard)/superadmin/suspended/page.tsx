// app/superadmin/suspended/page.tsx
import { getSuperadminUser } from '@/lib/auth/superadmin'
import { redirect } from 'next/navigation'
import { getSuspendedRestaurants } from '@/lib/actions/superadmin/restaurant-verification'
import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon, AlertTriangle } from 'lucide-react'
import { SuspendedRestaurantCard } from '@/components/superadmin/suspended-restaurant-card'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { PageHeader } from '@/components/ui/page-header'
import { AppInsetHeader } from '@/components/layout/AppInsetHeader'


export default async function SuspendedRestaurantsPage() {
  const user = await getSuperadminUser()

  if (!user) {
    redirect('/dashboard')
  }

  // Récupérer tous les restaurants suspendus
  const result = await getSuspendedRestaurants()

  if (!result.success || !result.data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Erreur lors du chargement des structures suspendues
        </p>
      </div>
    )
  }

  const restaurants = result.data

  // Séparer par raison de suspension
  const suspendedForCircuitSheet = restaurants.filter(r =>
    r.circuitSheet &&
    !r.circuitSheet.isSubmitted &&
    r.circuitSheet.autoSuspendedAt
  )

  const otherSuspended = restaurants.filter(r =>
    !suspendedForCircuitSheet.includes(r)
  )

  return (
    <>
      {/* En-tête */}
      <AppInsetHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/superadmin">Administration</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Structures suspendues</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </AppInsetHeader>
      <div className="layout-page">
        <PageHeader
            title="Structures suspendues"
            description="Gérez les structures dont le compte a été suspendu"
        />

      {/* Alert d'information */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Les structures suspendues ne peuvent plus accéder à leur compte et leur catalogue n'est
          pas accessible aux clients. La suspension peut être levée après validation des documents
          ou manuellement si nécessaire.
        </AlertDescription>
      </Alert>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <AppCard>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total suspendus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {restaurants.length}
            </div>
          </CardContent>
        </AppCard>

        <AppCard>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fiche circuit manquante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suspendedForCircuitSheet.length}
            </div>
          </CardContent>
        </AppCard>

        <AppCard>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Autres raisons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {otherSuspended.length}
            </div>
          </CardContent>
        </AppCard>
      </div>

      {/* Section : Suspendus pour fiche circuit */}
      {suspendedForCircuitSheet.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Fiche circuit non soumise</h2>
            <Badge variant="destructive">{suspendedForCircuitSheet.length}</Badge>
          </div>

          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Ces structures sous offre Business/Premium ont été suspendues automatiquement car elles n'ont
              pas soumis leur fiche circuit dans les 3 mois. Dès qu'elles la soumettent et que vous
              la validez, leur compte sera automatiquement réactivé.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            {suspendedForCircuitSheet.map((restaurant) => (
              <SuspendedRestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                suspensionReason="circuit_sheet"
              />
            ))}
          </div>
        </div>
      )}

      {/* Section : Autres suspensions */}
      {otherSuspended.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Autres suspensions</h2>
            <Badge variant="secondary">{otherSuspended.length}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {otherSuspended.map((restaurant) => (
              <SuspendedRestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                suspensionReason="other"
              />
            ))}
          </div>
        </div>
      )}

      {/* Message si aucune structure suspendue */}
      {restaurants.length === 0 && (
        <AppCard>
          <CardContent>
            <EmptyState title="Aucune structure suspendue pour le moment 🎉"/>
          </CardContent>
        </AppCard>
      )}
      </div>
    </>
  )
}