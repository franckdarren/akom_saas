// app/superadmin/suspended/page.tsx
import { getSuperadminUser } from '@/lib/auth/superadmin'
import { redirect } from 'next/navigation'
import { getSuspendedRestaurants } from '@/lib/actions/superadmin/restaurant-verification'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon, AlertTriangle } from 'lucide-react'
import { SuspendedRestaurantCard } from '@/components/superadmin/suspended-restaurant-card'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'


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
          Erreur lors du chargement des restaurants suspendus
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
                <BreadcrumbPage>Restaurants suspendus</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Restaurants suspendus</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les restaurants dont le compte a été suspendu
        </p>
      </div>

      {/* Alert d'information */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Les restaurants suspendus ne peuvent plus accéder à leur compte et leur menu n'est
          pas accessible aux clients. La suspension peut être levée après validation des documents
          ou manuellement si nécessaire.
        </AlertDescription>
      </Alert>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total suspendus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {restaurants.length}
            </div>
          </CardContent>
        </Card>

        <Card>
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
        </Card>

        <Card>
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
        </Card>
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
              Ces restaurants Business/Premium ont été suspendus automatiquement car ils n'ont
              pas soumis leur fiche circuit dans les 3 mois. Dès qu'ils la soumettent et que vous
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

      {/* Message si aucun restaurant suspendu */}
      {restaurants.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              Aucun restaurant suspendu pour le moment. 🎉
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </>
  )
}