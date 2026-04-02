// app/onboarding/add-restaurant/page.tsx
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import {getMultiRestaurantQuota} from '@/lib/actions/restaurant'
import {AddRestaurantForm} from './add-restaurant-form'
import {Building2, ArrowLeft, Crown, Lock} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {
    AppCard,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/app-card'
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {cn} from '@/lib/utils'

export default async function AddRestaurantPage() {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const quota = await getMultiRestaurantQuota()

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card">
                <div className="mx-auto max-w-2xl px-4 py-4 flex flex-wrap items-center gap-2 sm:gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4 mr-1.5"/>
                            Retour au dashboard
                        </Link>
                    </Button>
                    <div className="h-4 w-px bg-border"/>
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary"/>
                        </div>
                        <span className="font-semibold text-sm">Akôm</span>
                    </div>
                </div>
            </div>

            {/* Contenu */}
            <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
                {/* Titre */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Ajouter une structure
                    </h1>
                    <p className="text-muted-foreground">
                        Gérez plusieurs établissements depuis un seul compte Akôm.
                    </p>
                </div>

                {/* Quota */}
                <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
                    <div className="flex-1">
                        <p className="text-sm font-medium">Structures utilisées</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {quota.current} sur {quota.max} maximum avec votre plan
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {Array.from({length: quota.max}).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'h-2 w-8 rounded-full transition-colors',
                                    i < quota.current
                                        ? 'bg-primary'
                                        : 'bg-muted'
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Pas d'accès → upgrade */}
                {!quota.canAdd && (
                    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                        <Crown className="h-4 w-4 text-amber-600"/>
                        <AlertTitle className="text-amber-900 dark:text-amber-400">
                            Limite atteinte
                        </AlertTitle>
                        <AlertDescription className="text-amber-800 dark:text-amber-500">
                            Vous avez atteint la limite de votre plan actuel.
                            Passez au plan <strong>Premium</strong> pour gérer jusqu'à 10 structures.
                        </AlertDescription>
                        <div className="mt-3">
                            <Button size="sm" asChild>
                                <Link href="/dashboard/subscription/choose-plan">
                                    <Crown className="h-3.5 w-3.5 mr-1.5"/>
                                    Passer au Premium
                                </Link>
                            </Button>
                        </div>
                    </Alert>
                )}

                {/* Formulaire */}
                {quota.canAdd && (
                    <AppCard>
                        <CardHeader>
                            <CardTitle className="text-base">Informations de la structure</CardTitle>
                            <CardDescription>
                                Chaque structure a son propre menu, ses commandes et ses statistiques.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddRestaurantForm/>
                        </CardContent>
                    </AppCard>
                )}

                {/* Info multi-structure */}
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        À savoir
                    </p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0"/>
                            Vous pouvez switcher entre vos structures en un clic depuis la sidebar
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0"/>
                            Chaque structure a ses propres produits, tables et utilisateurs
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0"/>
                            Les données sont strictement isolées (RLS Supabase)
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}