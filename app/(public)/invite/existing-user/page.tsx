// app/invite/existing-user/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Mail } from 'lucide-react'
import Link from 'next/link'

export default function ExistingUserPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Vous avez déjà un compte ?</CardTitle>
                    <CardDescription>
                        Vous avez essayé d'accepter une invitation mais vous avez déjà un
                        compte sur Akôm
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Pour le moment, les invitations ne sont disponibles que pour les
                            nouveaux utilisateurs. Si vous avez déjà un compte et souhaitez
                            rejoindre un nouveau restaurant, veuillez contacter le support.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        <h3 className="font-semibold">Que faire ?</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                            <li>
                                Connectez-vous à votre compte existant en cliquant sur le
                                bouton ci-dessous
                            </li>
                            <li>
                                Contactez l'administrateur qui vous a invité et demandez-lui
                                de contacter le support Akôm
                            </li>
                            <li>
                                Notre équipe ajoutera manuellement votre compte au restaurant
                            </li>
                        </ol>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button asChild className="w-full">
                            <Link href="/login">Se connecter</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <a href="mailto:support@akom.app">
                                <Mail className="h-4 w-4" />
                                Contacter le support
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}