// components/invite/InvitationAcceptForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptInvitationWithAuth } from '@/lib/actions/invitation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Loader2, UserPlus, Info, Lock } from 'lucide-react'

interface InvitationAcceptFormProps {
    token: string
    email: string
    restaurantName: string
}

export function InvitationAcceptForm({
    token,
    email,
    restaurantName,
}: InvitationAcceptFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // Validations
        if (!password) {
            toast.error('Veuillez entrer un mot de passe')
            return
        }

        if (password.length < 6) {
            toast.error('Le mot de passe doit contenir au moins 6 caractères')
            return
        }

        if (password !== confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas')
            return
        }

        setIsLoading(true)

        try {
            const result = await acceptInvitationWithAuth(
                token,
                email,
                password,
                true // Toujours nouveau compte
            )

            if (result.success && result.shouldRedirect) {
                toast.success('Bienvenue !', {
                    description: `Votre compte a été créé et vous avez rejoint ${restaurantName}`,
                })
                router.push(result.shouldRedirect)
                router.refresh()
            } else {
                toast.error('Erreur', {
                    description: result.error || result.message,
                })
                setIsLoading(false)
            }
        } catch (error) {
            console.error('Erreur:', error)
            toast.error('Une erreur est survenue', {
                description: 'Impossible de créer le compte. Veuillez réessayer.',
            })
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Email (lecture seule) */}
            <div className="space-y-2">
                <Label htmlFor="email">Votre email</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                    Cet email sera utilisé pour votre compte Akôm
                </p>
            </div>

            {/* Information */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Créez votre compte Akôm pour rejoindre{' '}
                    <strong>{restaurantName}</strong>. Vous pourrez accéder au
                    dashboard dès que votre mot de passe sera configuré.
                </AlertDescription>
            </Alert>

            {/* Formulaire de création de compte */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">
                        <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Mot de passe <span className="text-destructive">*</span>
                        </div>
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Choisissez un mot de passe sécurisé"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                        autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                        Minimum 6 caractères
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                        <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Confirmer le mot de passe <span className="text-destructive">*</span>
                        </div>
                    </Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirmez votre mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Création du compte...
                        </>
                    ) : (
                        <>
                            <UserPlus className="h-4 w-4" />
                            Créer mon compte et rejoindre {restaurantName}
                        </>
                    )}
                </Button>
            </form>

            {/* Explication du processus */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Ce qui va se passer ensuite
                </h4>
                <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Votre compte Akôm sera créé avec l'email {email}</li>
                    <li>
                        Vous serez automatiquement ajouté à <strong>{restaurantName}</strong>
                    </li>
                    <li>Vous accéderez directement au dashboard de votre restaurant</li>
                    <li>Vous pourrez commencer à travailler immédiatement</li>
                </ol>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                    💡 <strong>Astuce :</strong> Notez bien votre mot de passe, vous en
                    aurez besoin pour vos prochaines connexions.
                </p>
            </div>
        </div>
    )
}