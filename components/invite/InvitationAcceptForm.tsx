// components/invite/InvitationAcceptForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/actions/auth'
import { acceptInvitation } from '@/lib/actions/invitation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Loader2, LogIn, UserPlus, Info } from 'lucide-react'

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
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')

    async function handleSignIn(e: React.FormEvent) {
        e.preventDefault()

        if (!password) {
            toast.error('Veuillez entrer votre mot de passe')
            return
        }

        setIsLoading(true)

        try {
            // Étape 1 : Se connecter
            const signInResult = await signIn({ email, password })

            if (!signInResult.success) {
                toast.error('Erreur de connexion', {
                    description: signInResult.error || signInResult.message,
                })
                setIsLoading(false)
                return
            }

            // Étape 2 : Accepter l'invitation automatiquement
            const acceptResult = await acceptInvitation(token)

            if (acceptResult.success) {
                toast.success('Bienvenue !', {
                    description: acceptResult.message,
                })
                
                // IMPORTANT : Redirection directe vers le dashboard
                // Pas de passage par /onboarding ou /restaurants/new
                router.push('/dashboard')
                router.refresh()
            } else {
                toast.error('Erreur', {
                    description: acceptResult.error || acceptResult.message,
                })
                setIsLoading(false)
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error)
            toast.error('Une erreur est survenue', {
                description: 'Impossible de se connecter. Veuillez réessayer.',
            })
            setIsLoading(false)
        }
    }

    async function handleSignUp(e: React.FormEvent) {
        e.preventDefault()

        // Validations côté client
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
            // Étape 1 : Créer le compte
            const signUpResult = await signUp({
                email,
                password,
                confirmPassword,
            })

            if (!signUpResult.success) {
                toast.error('Erreur lors de la création du compte', {
                    description: signUpResult.error || signUpResult.message,
                })
                setIsLoading(false)
                return
            }

            // Étape 2 : Accepter l'invitation automatiquement
            const acceptResult = await acceptInvitation(token)

            if (acceptResult.success) {
                toast.success('Compte créé avec succès !', {
                    description: `Vous avez rejoint ${restaurantName}`,
                })
                
                // IMPORTANT : Redirection directe vers le dashboard
                // Le système sait déjà que l'utilisateur appartient à un restaurant
                // grâce à l'acceptation de l'invitation
                router.push('/dashboard')
                router.refresh()
            } else {
                toast.error('Erreur', {
                    description: acceptResult.error || acceptResult.message,
                })
                setIsLoading(false)
            }
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error)
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
                <Label htmlFor="email">Email invité</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                    Vous devez utiliser cet email pour accepter l'invitation
                </p>
            </div>

            {/* Information importante */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    {activeTab === 'signin' ? (
                        <>
                            Vous avez déjà un compte Akôm ? Connectez-vous avec le même email
                            pour rejoindre automatiquement <strong>{restaurantName}</strong>.
                        </>
                    ) : (
                        <>
                            Pas encore de compte ? Créez-en un maintenant et vous serez
                            automatiquement ajouté à <strong>{restaurantName}</strong>.
                        </>
                    )}
                </AlertDescription>
            </Alert>

            {/* Onglets connexion / inscription */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">
                        J'ai déjà un compte
                    </TabsTrigger>
                    <TabsTrigger value="signup">
                        Créer un compte
                    </TabsTrigger>
                </TabsList>

                {/* Onglet Connexion */}
                <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signin-password">
                                Mot de passe <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="signin-password"
                                type="password"
                                placeholder="Entrez votre mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                                autoFocus
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Connexion en cours...
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-4 w-4" />
                                    Se connecter et rejoindre
                                </>
                            )}
                        </Button>

                        <div className="text-xs text-center text-muted-foreground pt-2">
                            Après connexion, vous rejoindrez automatiquement {restaurantName}
                        </div>
                    </form>
                </TabsContent>

                {/* Onglet Inscription */}
                <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-password">
                                Mot de passe <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="signup-password"
                                type="password"
                                placeholder="Choisissez un mot de passe"
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
                                Confirmer le mot de passe <span className="text-destructive">*</span>
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
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4" />
                                    Créer mon compte et rejoindre
                                </>
                            )}
                        </Button>

                        <div className="text-xs text-center text-muted-foreground pt-2">
                            Après inscription, vous rejoindrez automatiquement {restaurantName}
                        </div>
                    </form>
                </TabsContent>
            </Tabs>

            {/* Explication du processus */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Comment ça fonctionne ?
                </h4>
                <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>
                        {activeTab === 'signin' 
                            ? 'Connectez-vous avec votre mot de passe' 
                            : 'Créez votre compte Akôm avec un mot de passe sécurisé'}
                    </li>
                    <li>
                        Vous serez automatiquement ajouté à <strong>{restaurantName}</strong>
                    </li>
                    <li>
                 // components/invite/InvitationAcceptForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/actions/auth'
import { acceptInvitation } from '@/lib/actions/invitation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Loader2, LogIn, UserPlus, Info } from 'lucide-react'

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
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')

    async function handleSignIn(e: React.FormEvent) {
        e.preventDefault()

        if (!password) {
            toast.error('Veuillez entrer votre mot de passe')
            return
        }

        setIsLoading(true)

        try {
            // Étape 1 : Se connecter
            const signInResult = await signIn({ email, password })

            if (!signInResult.success) {
                toast.error('Erreur de connexion', {
                    description: signInResult.error || signInResult.message,
                })
                setIsLoading(false)
                return
            }

            // Étape 2 : Accepter l'invitation automatiquement
            const acceptResult = await acceptInvitation(token)

            if (acceptResult.success) {
                toast.success('Bienvenue !', {
                    description: acceptResult.message,
                })
                
                // IMPORTANT : Redirection directe vers le dashboard
                // Pas de passage par /onboarding ou /restaurants/new
                router.push('/dashboard')
                router.refresh()
            } else {
                toast.error('Erreur', {
                    description: acceptResult.error || acceptResult.message,
                })
                setIsLoading(false)
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error)
            toast.error('Une erreur est survenue', {
                description: 'Impossible de se connecter. Veuillez réessayer.',
            })
            setIsLoading(false)
        }
    }

    async function handleSignUp(e: React.FormEvent) {
        e.preventDefault()

        // Validations côté client
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
            // Étape 1 : Créer le compte
            const signUpResult = await signUp({
                email,
                password,
                confirmPassword,
            })

            if (!signUpResult.success) {
                toast.error('Erreur lors de la création du compte', {
                    description: signUpResult.error || signUpResult.message,
                })
                setIsLoading(false)
                return
            }

            // Étape 2 : Accepter l'invitation automatiquement
            const acceptResult = await acceptInvitation(token)

            if (acceptResult.success) {
                toast.success('Compte créé avec succès !', {
                    description: `Vous avez rejoint ${restaurantName}`,
                })
                
                // IMPORTANT : Redirection directe vers le dashboard
                // Le système sait déjà que l'utilisateur appartient à un restaurant
                // grâce à l'acceptation de l'invitation
                router.push('/dashboard')
                router.refresh()
            } else {
                toast.error('Erreur', {
                    description: acceptResult.error || acceptResult.message,
                })
                setIsLoading(false)
            }
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error)
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
                <Label htmlFor="email">Email invité</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                    Vous devez utiliser cet email pour accepter l'invitation
                </p>
            </div>

            {/* Information importante */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    {activeTab === 'signin' ? (
                        <>
                            Vous avez déjà un compte Akôm ? Connectez-vous avec le même email
                            pour rejoindre automatiquement <strong>{restaurantName}</strong>.
                        </>
                    ) : (
                        <>
                            Pas encore de compte ? Créez-en un maintenant et vous serez
                            automatiquement ajouté à <strong>{restaurantName}</strong>.
                        </>
                    )}
                </AlertDescription>
            </Alert>

            {/* Onglets connexion / inscription */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">
                        J'ai déjà un compte
                    </TabsTrigger>
                    <TabsTrigger value="signup">
                        Créer un compte
                    </TabsTrigger>
                </TabsList>

                {/* Onglet Connexion */}
                <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signin-password">
                                Mot de passe <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="signin-password"
                                type="password"
                                placeholder="Entrez votre mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                                autoFocus
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Connexion en cours...
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-4 w-4" />
                                    Se connecter et rejoindre
                                </>
                            )}
                        </Button>

                        <div className="text-xs text-center text-muted-foreground pt-2">
                            Après connexion, vous rejoindrez automatiquement {restaurantName}
                        </div>
                    </form>
                </TabsContent>

                {/* Onglet Inscription */}
                <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-password">
                                Mot de passe <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="signup-password"
                                type="password"
                                placeholder="Choisissez un mot de passe"
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
                                Confirmer le mot de passe <span className="text-destructive">*</span>
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
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4" />
                                    Créer mon compte et rejoindre
                                </>
                            )}
                        </Button>

                        <div className="text-xs text-center text-muted-foreground pt-2">
                            Après inscription, vous rejoindrez automatiquement {restaurantName}
                        </div>
                    </form>
                </TabsContent>
            </Tabs>

            {/* Explication du processus */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Comment ça fonctionne ?
                </h4>
                <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>
                        {activeTab === 'signin' 
                            ? 'Connectez-vous avec votre mot de passe' 
                            : 'Créez votre compte Akôm avec un mot de passe sécurisé'}
                    </li>
                    <li>
                        Vous serez automatiquement ajouté à <strong>{restaurantName}</strong>
                    </li>
                    <li>
                        Vous accéderez directement au dashboard de votre restaurant
                    </li>
                    <li>
                        Vous pourrez commencer à travailler immédiatement
                    </li>
                </ol>
            </div>
        </div>
    )
}       Vous accéderez directement au dashboard de votre restaurant
                    </li>
                    <li>
                        Vous pourrez commencer à travailler immédiatement
                    </li>
                </ol>
            </div>
        </div>
    )
}