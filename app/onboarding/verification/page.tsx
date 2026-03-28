// app/onboarding/verification/page.tsx
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    Clock,
    FileText,
} from 'lucide-react'
import {VerificationDocumentsForm} from '@/components/restaurant/verification-documents-form'
import {Progress} from '@/components/ui/progress'
import {getLabels} from '@/lib/config/activity-labels' // ← NOUVEAU

export default async function VerificationPage() {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id},
        include: {
            restaurant: {
                include: {
                    verificationDocuments: true,
                },
                // ← activityType inclus via include complet
            },
        },
    })

    if (!restaurantUser) redirect('/onboarding')

    const {restaurant} = restaurantUser

    if (restaurant.isVerified) redirect('/dashboard')

    // ← Calcul des labels
    const labels = getLabels(restaurant.activityType)

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-6 sm:py-12 px-4">
            <div className="w-full max-w-3xl">

                <div className="mb-10">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Étape 3 sur 4</span>
                        {/* ← Label dynamique */}
                        <span>Vérification de votre {labels.structureName}</span>
                    </div>
                    <Progress value={75}/>
                </div>

                <Card className="mb-8 border-none shadow-lg bg-primary text-primary-foreground">
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <div className="bg-primary-foreground/10 p-2 rounded-xl">
                                <CheckCircle2 className="h-6 w-6"/>
                            </div>
                            <div>
                                <CardTitle className="text-xl">
                                    {/* ← Label dynamique */}
                                    Bienvenue sur Akôm, {restaurant.name} 🎉
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/80 mt-1">
                                    Dernière étape avant l&apos;activation de votre compte
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-3 text-primary-foreground/90">
                        <p>
                            Pour garantir la sécurité des paiements et protéger vos {labels.customerNameCapital}s,
                            nous devons vérifier l&apos;identité de votre {labels.structureName}.
                        </p>
                        <div className="flex items-center gap-2 text-sm opacity-90">
                            <Clock className="h-4 w-4"/>
                            Vérification sous 24 à 48h après soumission.
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-lg">Comment ça fonctionne ?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="flex gap-4">
                            <div className="bg-muted p-2 rounded-lg flex items-center">
                                <FileText className="h-5 w-5 text-primary"/>
                            </div>
                            <div>
                                <p className="font-medium">1. Soumettez vos documents</p>
                                <p className="text-sm text-muted-foreground">
                                    {/* ← Label dynamique */}
                                    Pièce d&apos;identité et document officiel de votre {labels.structureName}.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-muted p-2 rounded-lg flex items-center">
                                <ShieldCheck className="h-5 w-5 text-primary"/>
                            </div>
                            <div>
                                <p className="font-medium">2. Vérification par notre équipe</p>
                                <p className="text-sm text-muted-foreground">
                                    Nous validons vos informations en toute confidentialité.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-muted p-2 rounded-lg flex items-center">
                                <CheckCircle2 className="h-5 w-5 text-primary"/>
                            </div>
                            <div>
                                <p className="font-medium">3. Activation automatique</p>
                                <p className="text-sm text-muted-foreground">
                                    {/* ← Label dynamique */}
                                    Votre {labels.catalogName} devient accessible aux {labels.customerNameCapital}s
                                    immédiatement.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div
                    className="text-sm mb-8 flex items-center gap-3 border border-destructive rounded-md p-5 text-destructive">
                    <AlertTriangle className="h-4 w-4"/>
                    <div>
                        {/* ← Label dynamique */}
                        Votre {labels.catalogName} ne sera pas visible publiquement tant que la vérification
                        n&apos;est pas validée.
                    </div>
                </div>

                <div>
                    <div>
                        <h2 className="leading-none font-semibold text-lg">Soumettre vos documents</h2>
                        <p className="text-sm text-muted-foreground mt-2 mb-5">
                            Toutes les données sont cryptées et sécurisées.
                        </p>
                    </div>
                    <div>
                        <VerificationDocumentsForm
                            restaurantId={restaurant.id}
                            verificationDocument={restaurant.verificationDocuments}
                        />
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <a
                        href="/login"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Se connecter →
                    </a>
                </div>
            </div>
        </div>
    )
}