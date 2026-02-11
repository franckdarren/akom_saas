// app/onboarding/verification/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { VerificationDocumentsForm } from '@/components/restaurant/verification-documents-form'

export default async function VerificationPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Récupérer le restaurant de l'utilisateur
    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
        include: {
            restaurant: {
                include: {
                    verificationDocuments: true,
                },
            },
        },
    })

    if (!restaurantUser) {
        redirect('/onboarding')
    }

    const { restaurant } = restaurantUser

    // Si déjà vérifié, rediriger vers le dashboard
    if (restaurant.isVerified) {
        redirect('/dashboard')
    }

    return (
        <div className="container max-w-2xl py-10">
            {/* Message de bienvenue */}
            <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <CardHeader>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-blue-600 mt-1" />
                        <div>
                            <CardTitle className="text-blue-900 dark:text-blue-100">
                                Bienvenue sur Akôm, {restaurant.name} ! 🎉
                            </CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="text-blue-800 dark:text-blue-200">
                    <p className="mb-3">
                        Votre restaurant a été créé avec succès ! Pour des raisons de sécurité et 
                        de conformité, nous devons vérifier votre identité avant d'activer votre compte.
                    </p>
                    <p className="font-medium">
                        Cette vérification prend généralement 24 à 48 heures après la soumission de vos documents.
                    </p>
                </CardContent>
            </Card>

            {/* Alerte importante */}
            <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    <strong>Important :</strong> Vous pouvez explorer l'interface dès maintenant, 
                    mais votre menu ne sera pas accessible aux clients tant que votre compte n'est pas vérifié. 
                    Nous vous recommandons de soumettre vos documents dès maintenant pour activer votre compte rapidement.
                </AlertDescription>
            </Alert>

            {/* Formulaire de vérification */}
            <VerificationDocumentsForm
                restaurantId={restaurant.id}
                verificationDocument={restaurant.verificationDocuments}
            />

            {/* Bouton pour passer (optionnel) */}
            <div className="mt-6 text-center">
                <a 
                    href="/dashboard" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Je soumettrai mes documents plus tard →
                </a>
            </div>
        </div>
    )
}